# UBlock — IPFS + Blockchain Integration Guide

## How it all works

```
Browser  ──upload──►  Express (multer)  ──uploadFile──►  IPFS (Pinata/local)
                             │                                    │
                             │◄──── CID + bytes32 hash ──────────┘
                             │
                             ├──create──►  MongoDB  (filePath = IPFS gateway URL)
                             │
                             └──registerEvidence──►  Ethereum (Sepolia)
                                                           │
                                          onChainId + txHash written back to MongoDB
```

Every access, status change and delete is then logged as a `CustodyEvent` on-chain
via `eth_getLogs` — zero storage cost, permanent, tamper-proof.

---

## Step 1 — Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | https://nodejs.org |
| IPFS Desktop | any | https://docs.ipfs.tech/install/ipfs-desktop/ (dev only) |
| MetaMask | any | https://metamask.io (for the operator wallet) |
| Alchemy account | — | https://www.alchemy.com (free tier is fine) |
| Pinata account | — | https://pinata.cloud (free: 1 GB storage) |

---

## Step 2 — Get Sepolia test ETH

Your operator wallet pays gas for every write transaction.

1. Go to https://sepoliafaucet.com
2. Enter your operator wallet address
3. Receive ~0.5 Sepolia ETH (free)
4. Repeat if needed — each `registerEvidence` costs ~50 000 gas ≈ $0.002 on mainnet

---

## Step 3 — Install blockchain dependencies

```bash
cd blockchain
npm install
```

This installs:
- `hardhat` — compile + deploy framework
- `@nomicfoundation/hardhat-toolbox` — testing (chai, ethers), coverage, gas reporter
- `ethers` — used by the backend service

Install backend IPFS + ethers dependencies:

```bash
cd api          # your backend root
npm install kubo-rpc-client ethers
```

---

## Step 4 — Configure environment variables

Copy `api/src/.env` (the template provided) and fill in:

```env
# From Alchemy dashboard → your Sepolia app → View key
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/xxxxxxxxxxxxxxxx

# From MetaMask → Account Details → Export Private Key
OPERATOR_PRIVATE_KEY=0xabc123...

# From Pinata → API Keys → New Key → select pinFileToIPFS
PINATA_JWT=eyJhbGci...
```

---

## Step 5 — Compile and deploy the contract

```bash
cd blockchain

# Compile — outputs artifacts/ folder with ABI
npm run compile

# Run tests first (uses in-memory Hardhat network, free)
npm test

# Deploy to Sepolia (~30 seconds, costs ~0.001 Sepolia ETH)
npm run deploy:sepolia
```

The deploy script writes `api/blockchain/deployment.json`:

```json
{
  "network": "sepolia",
  "contractAddress": "0xABC...",
  "deployedAt": "2025-01-01T00:00:00.000Z",
  "abi": [ ... ]
}
```

The backend reads this file automatically — you do **not** need to paste the ABI
into your `.env`. Just commit `deployment.json` to your repo.

---

## Step 6 — (Optional) Verify on Etherscan

```bash
cd blockchain
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

This makes the contract source publicly readable on Sepolia Etherscan, which is
important for an evidence system since anyone can independently audit the audit trail.

---

## Step 7 — Start the backend

```bash
cd api
npm run dev
```

On startup, `blockchain.service.js` reads `deployment.json` and initialises the
ethers provider and wallet. You'll see:

```
✅ MongoDB connected: 127.0.0.1:27017/Ublock
✅ Server running on port 3000
```

---

## Step 8 — Test the full flow

### Upload evidence

```bash
curl -X POST http://localhost:3000/evidence/upload \
  -H "Authorization: Bearer <JWT>" \
  -F "file=@/path/to/evidence.jpg" \
  -F "title=Crime Scene Photo A" \
  -F "caseNumber=CASE-2025-001" \
  -F "collectedBy=Det. Sarah Kim" \
  -F "collectionDate=2025-01-15" \
  -F "description=Exterior shot showing forced entry" \
  -F "tags=exterior,entry-point"
```

Response:

```json
{
  "message": "Evidence uploaded successfully",
  "evidence": {
    "_id": "6654a1b2c3d4e5f6a7b8c9d0",
    "title": "Crime Scene Photo A",
    "filePath": "https://ipfs.io/ipfs/bafybeig...",
    "ipfsHash": "bafybeig...",
    "onChainId": null,          ← null initially, written async
    "registrationTxHash": null  ← filled after ~15 seconds
  }
}
```

After ~15 seconds, poll MongoDB and `onChainId` will be set.

### Get blockchain audit log

```bash
curl http://localhost:3000/evidence/6654a1b2c3d4e5f6a7b8c9d0/audit \
  -H "Authorization: Bearer <JWT>"
```

```json
{
  "source": "blockchain",
  "onChainId": 42,
  "events": [
    {
      "action": "ACCESSED",
      "detail": "Det. Sarah Kim",
      "actor": "0xOperatorWallet",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "txHash": "0xabc..."
    }
  ]
}
```

---

## API reference (new endpoints)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/evidence/upload` | ✅ | Upload file → IPFS → Blockchain |
| GET | `/evidence/:id` | ✅ | Get evidence (logs access on-chain) |
| PATCH | `/evidence/:id/status` | ✅ | Update status + logs custody event |
| DELETE | `/evidence/:id` | ✅ | Soft-delete on-chain + hard-delete in DB |
| GET | `/evidence/:id/audit` | ✅ | Full blockchain custody audit log |

---

## Gas cost reference (Sepolia testnet)

| Operation | Gas | Mainnet cost (at 10 gwei) |
|---|---|---|
| `registerEvidence` | ~85 000 | ~$0.003 |
| `recordAccess` event | ~28 000 | ~$0.001 |
| `recordCustodyEvent` | ~32 000 | ~$0.001 |
| `deleteEvidence` | ~35 000 | ~$0.001 |
| `getEvidence` (view) | 0 | free |
| `verifyIntegrity` (view) | 0 | free |

The event-only pattern for access logs saves ~85% gas vs storing arrays on-chain.

---

## Dev mode (no real blockchain)

If `SEPOLIA_URL` or `OPERATOR_PRIVATE_KEY` are not set, all blockchain calls
are silently skipped. Evidence is still saved to MongoDB and IPFS normally.
The `onChainId` will remain null until you deploy and configure.

For local testing with a free in-memory chain:

```bash
cd blockchain
npx hardhat node          # starts local RPC on localhost:8545
npm run deploy:local      # deploys to local network
```

Then update `.env`:

```env
SEPOLIA_URL=http://localhost:8545
OPERATOR_PRIVATE_KEY=<one of the 20 auto-funded hardhat accounts>
```

---

## Project file structure

```
UBlock/
├── blockchain/                 ← Hardhat project
│   ├── contracts/
│   │   └── EvidenceVault.sol   ← The contract
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── EvidenceVault.test.js
│   ├── ipfs_service/
│   │   └── ipfs.service.js     ← IPFS upload/download
│   ├── hardhat.config.js
│   └── package.json
│
└── api/
    ├── blockchain/
    │   └── deployment.json     ← auto-generated by deploy.js
    ├── services/
    │   ├── blockchain.servce.js  ← ethers.js contract wrapper
    │   └── evidence.service.js   ← orchestrates IPFS + blockchain + MongoDB
    ├── middleware/
    │   └── recordAccess.js       ← logs every GET on-chain
    └── src/.env                  ← your secrets (never commit)
```
