# UBlock — Evidence Management System

## Quick Start

### 1. Set up the blockchain (one-time)

```bash
cd blockchain
npm install
npm run compile
npm test                   # all 7 tests should pass
npm run deploy:sepolia     # deploys contract, writes api/blockchain/deployment.json
```

### 2. Set up the API

```bash
cd api
npm install
cp src/.env src/.env.local   # fill in your real values (see GUIDE.md)
npm run dev
```

### Folder layout

```
ublock-complete/
├── blockchain/            ← Hardhat project (compile, test, deploy)
│   ├── contracts/
│   │   └── EvidenceVault.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── EvidenceVault.test.js
│   ├── ipfs_service/
│   │   └── ipfs.service.js
│   ├── hardhat.config.js
│   ├── package.json
│   └── GUIDE.md           ← Full step-by-step guide
│
└── api/                   ← Express backend
    ├── blockchain/
    │   └── deployment.json  ← auto-written by deploy.js
    ├── config/
    ├── controller/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── services/
    │   ├── evidence.service.js   ← orchestrates IPFS + blockchain + MongoDB
    │   ├── blockchain.servce.js  ← ethers.js contract wrapper
    │   └── ipfs.service.js       ← Pinata / local IPFS node
    ├── src/
    │   ├── server.js
    │   └── .env                  ← your secrets (never commit)
    └── utils/
```

See `blockchain/GUIDE.md` for the full integration walkthrough.
