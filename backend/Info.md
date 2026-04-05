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

















## Quick Notes

### Backend

### API

### Routes
1. Face Routes:
* Enroll: save a webcam frame as a face sample (requires JWT — must be logged in)

* Face login: authenticate with webcam instead of password

* Unenroll: delete all stored face data for the logged-in user






### Middlewares
1. RecordAccess middleware
- Verifies the evidence exists in MongoDB
- Attaches it to req.evidence so the controller doesn't fetch it again
- Logs the access on-chain (fire-and-forget so blockchain lag never blocks the HTTP response)



### Controller:
1. Evidence Controller:
prepare-upload
Receives the file and metadata, uploads to IPFS, saves a pending
 * MongoDB record, and returns the data the browser needs to call the
 * smart contract via MetaMask.

confirm-upload
 *
 * Called by the frontend after MetaMask confirms the blockchain tx.
 * Body: { mongoId, evidenceId, txHash, walletAddress }



2. Face Controller
* POST /auth/face/enroll ────────────────────────────────────────────────────
- Called after normal registration; user submits one or more webcam frames.
- Body: { imageData: "<base64>" }   (JWT required via authenticate middleware)


* POST /auth/face/login ─────────────────────────────────────────────────────
- Face-only login flow. Body: { email, imageData }
- Returns JWT if face matches, 401 otherwise.

* DELETE /auth/face/unenroll ────────────────────────────────────────────────
- Remove face data for the logged-in user. (JWT required)











### Services
1. Blockchain Service:

* Single source of truth for all Ethereum interactions.
 * Reads contract address + ABI from api/blockchain/deployment.json
 * (written by the Hardhat deploy script) so you never have to copy-paste
 * the ABI into your .env manually.
 *
 * Gas strategy:
 *  - All writes go through a pre-funded OPERATOR wallet.
 *  - All reads (view functions, eth_getLogs) are free.
 *  - We use ethers.js v6 (lighter bundle than web3.js, built-in BigInt).




* Single source of truth for all Ethereum interactions.
* Reads contract address + ABI from api/blockchain/deployment.json
* (written by the Hardhat deploy script) so you never have to copy-paste
* the ABI into your .env manually.

* Gas strategy:
*  - All writes go through a pre-funded OPERATOR wallet.
*  - All reads (view functions, eth_getLogs) are free.
*  - We use ethers.js v6 (lighter bundle than web3.js, built-in BigInt).

* Fixes:
 *  1. "already known" error — caused by concurrent txs sharing a nonce.
 *     Solved with a simple async mutex (nonce lock) so txs queue instead
 *     of racing. ethers v6 auto-manages nonces when you use wallet.sendTransaction,
 *     but concurrent awaits can still collide. The lock serialises all sends.
 *  2. EIP-1559 gas — use provider.getFeeData() for optimal pricing.
 *  3. recordAccess deduplication — skip the blockchain call if the same
 *     evidence was accessed within the last 60 seconds (debounce).

* Nonce mutex — prevents "already known" / nonce collisions ─────────────────
- All operator transactions are serialised through this queue so no two concurrent requests ever use the same nonce.


* EIP-1559 gas override ─────────────────────────────────────────────────────
- Uses provider.getFeeData() which queries eth_feeHistory and computes optimal maxFeePerGas and maxPriorityFeePerGas automatically.
- Unspent gas is refunded — only actual usage is charged.


* Access debounce — prevents duplicate recordAccess txs ────────────────────
- Maps `${onChainId}:${actor}` → lastLoggedAt (ms)




blockchain.servce.js  (operator-pays functions)
 *
 * Fixes:
 *  1. "already known" error — caused by concurrent txs sharing a nonce.
 *     Solved with a simple async mutex (nonce lock) so txs queue instead
 *     of racing. ethers v6 auto-manages nonces when you use wallet.sendTransaction,
 *     but concurrent awaits can still collide. The lock serialises all sends.
 *  2. EIP-1559 gas — use provider.getFeeData() for optimal pricing.
 *  3. recordAccess deduplication — skip the blockchain call if the same
 *     evidence was accessed within the last 60 seconds (debounce).








2. Evidence Service:
* Create evidence — uploads to IPFS, registers on blockchain ─────────────────
/**
 * Full flow:
 *  1. multer saves file to ./uploads/<uuid>.<ext>
 *  2. Upload the file to IPFS → get CID + bytes32 hash
 *  3. Save evidence record to MongoDB (with ipfsHash + cid)
 *  4. Register the bytes32 hash on-chain → get evidenceId
 *  5. Update MongoDB with the on-chain evidenceId + txHash
 *  6. Delete the local temp file (it now lives on IPFS)









prepareUpload (Step 1 — wallet-pays flow) ─────────────────────────────────
// Uploads file to IPFS, creates a PENDING MongoDB record, returns the data the
// browser needs to call registerEvidenceByUser() via MetaMask.
// Does NOT call the blockchain — that happens in the browser.


prepareUpload
 *
 * Step 1 of the user-pays-gas flow.
 *  1. Upload file to IPFS via Pinata/local node
 *  2. Save a PENDING evidence record to MongoDB
 *  3. Delete the local temp file
 *  4. Return { mongoId, ipfsHash32, cid, mimeType } to the frontend
 *     so the browser can call the contract directly via MetaMask


confirmUpload (Step 2 — wallet-pays flow) ─────────────────────────────────
// Called by the frontend after MetaMask confirms the tx.
// Finalises the pending MongoDB record.
// Idempotent — safe to call twice with the same mongoId.

* confirmUpload
 * Step 2 — called by the frontend after MetaMask confirms the tx.
 * Finalises the MongoDB record with the on-chain evidenceId and txHash.







3. IPFS Service
 *
 * Uses Pinata (or any Kubo-compatible gateway) in production.
 * Falls back to a local IPFS node when PINATA_JWT is absent (dev mode).
 *
 * Cost note: Pinata free tier = 1 GB pinned storage, 100 GB bandwidth/month.
 * For evidence files you almost certainly want a paid pin so files persist.

* CID → bytes32 helper ──────────────────────────────────────────────────────
/**
 * Extracts the 32-byte sha2-256 digest from a CIDv1 multihash.
 * Returns a hex string prefixed with 0x, ready for Solidity bytes32.
 *
 * Multihash layout: <varint fn code> <varint digest len> <digest bytes>
 * For sha2-256:  fn=0x12 (2 bytes varint), len=0x20 (1 byte varint), then 32 bytes.


* Inverse: convert a bytes32 hex string back to the sha2-256 multihash prefix
 * so we can reconstruct the CID for retrieval.
 * Note: this gives you the digest; to get the full CID you also need the codec
 * (dag-pb = 0x70 for files). In practice just store the full CID string in MongoDB.




4. Face Service:
face.service.js
 * Node.js client for the Python face recognition microservice.
 * All calls add X-Service-Secret so the Python service rejects
 * unauthenticated requests.
 *
 * Methods:
 *   registerFace(userId, base64Image)  — called during /auth/register
 *   verifyFace(userId, base64Image)    — called during /auth/login
 *   deleteFace(userId)                 — called when a user account is deleted
 *   isAvailable()                      — health check (non-throwing)








### Blockchain
1. Contract:

Cost-optimisation decisions:
 *  - Event-only pattern for chain-of-custody logs: events cost ~375 gas vs
 *    ~20 000 gas for SSTORE. The backend indexes them via eth_getLogs.
 *  - Evidence metadata stored as a tight struct using uint64 timestamps
 *    (saves 2 storage slots vs uint256).
 *  - ipfsHash stored as bytes32 (CIDv1 sha2-256 multihash fits in 32 bytes)
 *    — no dynamic string storage on-chain.
 *  - onlyOperator guard — a single privileged backend wallet signs all txns,
 *    so users never need MetaMask or ETH.
 *  - No loops over unbounded arrays; all iteration is off-chain via events.


Changes from v1:
 *  - registerEvidenceByUser() is public (no onlyOperator).
 *    Any connected wallet can register evidence and pays their own gas.
 *  - The struct stores uploadedBy = msg.sender (the user's MetaMask wallet).
 *  - Operator-only functions (recordAccess, recordCustodyEvent, deleteEvidence)
 *    remain restricted — only the backend wallet calls those.
 *  - verifyIntegrity() is public so anyone can audit without gas.




EvidenceVault v3
 *
 * Gas optimisations vs v2:
 *  - bytes32 ipfsHash (1 slot) instead of string (dynamic)
 *  - uint64 timestamps packed with bool into 1 slot (vs 3 slots for uint256)
 *  - Events for all custody logs — emit costs ~375 gas; SSTORE costs ~20 000
 *  - No unbounded arrays — all iteration is off-chain via eth_getLogs
 *  - string params use calldata (not memory) — saves copy cost
 *
 * Access control:
 *  - registerEvidenceByUser()  → PUBLIC — any wallet, user pays gas
 *  - recordAccess()            → onlyOperator — backend wallet pays
 *  - recordCustodyEvent()      → onlyOperator
 *  - deleteEvidence()          → onlyOperator








### Client

### Hooks
1. useBlockchain.js v1
* Drives the MetaMask transaction entirely through window.ethereum —
* no ethers.js or web3.js bundle required on the frontend.

* Encodes calldata for EvidenceVault.registerEvidenceByUser(bytes32,string,string)
* manually so the only dependency is the Vite env var VITE_CONTRACT_ADDRESS.
* Transaction status machine:
   idle → pending (MetaMask popup) → confirming (waiting for block) → confirmed | error


* Uses EIP-1559 gas pricing (maxFeePerGas + maxPriorityFeePerGas) instead of legacy gasPrice. On Sepolia and mainnet this:
 *   - Prevents overpaying when the base fee is low
 *   - Avoids stuck transactions when the base fee spikes
 *   - Typically saves 10–30% vs legacy gasPrice txs


* useBlockchain v2
 *
 * Drives the MetaMask transaction entirely through window.ethereum —
 * no ethers.js or web3.js bundle required on the frontend.
 *
 * Encodes calldata for EvidenceVault.registerEvidenceByUser(bytes32,string,string)
 * manually so the only dependency is the Vite env var VITE_CONTRACT_ADDRESS.
 *
 * Transaction status machine:
 *   idle → pending (MetaMask popup) → confirming (waiting for block) → confirmed | error



useBlockchain v3
 *
 * Uses EIP-1559 gas pricing (maxFeePerGas + maxPriorityFeePerGas) instead
 * of legacy gasPrice. On Sepolia and mainnet this:
 *   - Prevents overpaying when the base fee is low
 *   - Avoids stuck transactions when the base fee spikes
 *   - Typically saves 10–30% vs legacy gasPrice txs



useBlockchain v4
 *
 * Uses ethers.js Interface to encode calldata — eliminates all manual
 * ABI encoding bugs (wrong selector, wrong offsets, wrong padding).
 *
 * ethers is already in your package.json (added for blockchain.servce.js).
 * If the frontend bundle size matters, only Interface is imported (not the
 * full provider/wallet stack — those live in the backend).


* Parse evidenceId from receipt logs ───────────────────────────────────────
// We find the first log emitted BY our contract and read topic[1] as uint256.
// topic[0] = event signature hash
// topic[1] = first indexed param = evidenceId (uint256)



2. useEvidenceVault
 *
 * Thin hook wrapping the EvidenceVault contract.
 * Uses ethers.js BrowserProvider (MetaMask) — the user signs and pays.
 *
 * The ABI and contract address are injected at build time from the
 * deployment.json produced by Hardhat. Vite exposes them via
 * import.meta.env.VITE_CONTRACT_ADDRESS / VITE_CONTRACT_ABI.



3. useWebcam
 *
 * Manages a webcam stream and single-frame capture.
 *
 * Returns:
 *   videoRef     — attach to <video> element
 *   canvasRef    — hidden canvas used for frame capture
 *   isStreaming  — bool
 *   error        — string | null
 *   startCamera  — async () => void
 *   stopCamera   — () => void
 *   captureFrame — () => string | null  (base64 JPEG data URL)
 */








### Pages
1. UploadPage — MetaMask user-pays-gas edition
 *
 * Supports two upload modes:
 *   A. User-pays: MetaMask connected → IPFS then MetaMask signs blockchain tx
 *   B. Operator-pays: no wallet → old flow, backend operator pays gas
 *
 * Step machine:
 *   'form'        Initial form + file picker
 *   'wallet'      WalletConnectModal shown (if user clicked connect)
 *   'uploading'   File uploading to IPFS (shows spinner)
 *   'signing'     Waiting for MetaMask signature
 *   'done'        Success screen

 UploadPage — MetaMask user-pays-gas edition
 *
 * Supports two upload modes:
 *   A. User-pays: MetaMask connected → IPFS then MetaMask signs blockchain tx
 *   B. Operator-pays: no wallet → old flow, backend operator pays gas
 *
 * Step machine:
 *   'form'        Initial form + file picker
 *   'wallet'      WalletConnectModal shown (if user clicked connect)
 *   'uploading'   File uploading to IPFS (shows spinner)
 *   'signing'     Waiting for MetaMask signature
 *   'done'        Success screen





2. ReportsPage
 *
 * Left panel  — saved reports list (filterable by case number)
 * Right panel — generate new report | view a saved report
 *
 * Flow:
 *  1. User enters a case number and clicks Generate
 *  2. Live report renders immediately
 *  3. User can Save it (POST /reports/saved) and/or Download PDF
 *  4. Saved reports appear in the left sidebar and persist across sessions
 *  5. Clicking a saved report loads it in the right panel (GET /reports/saved/:id)



3. LoginPage
 *
 * Two auth modes selectable by tab:
 *   Password  — email + password (existing flow)
 *   Face ID   — email + webcam capture → /auth/face/login
 */


4. RegisterPage
 *
 * Three-step flow:
 *   Step 1 — Fill officer details → POST /auth/register → receive JWT
 *   Step 2 — Optional face enroll → multiple webcam captures
 *             POST /auth/face/enroll (with JWT from step 1)
 *   Step 3 — Done
 */






### Context
1. WalletProvider
 *
 * Manages MetaMask connection state globally.
 * Exposes: { account, chainId, isConnected, isConnecting, connect, disconnect, switchToSepolia }
 *
 * The wallet is optional — users who don't have MetaMask can still use the app;
 * the backend operator wallet will pay for their blockchain registration instead.


### Components
1. WalletConnectModal
 *
 * Shown before the upload form when MetaMask is not yet connected.
 * Gives the user the choice to connect (they pay gas) or skip
 * (the backend operator wallet pays gas on their behalf).
 *
 * Props:
 *   onConnected  — called after wallet is connected AND on Sepolia
 *   onSkip       — called if user chooses operator-pays mode


2. WalletButton
 * Shows in the topbar. Cycles through:
 *   - "Connect Wallet"   (not connected)
 *   - "Wrong Network"    (connected but not Sepolia)
 *   - "0x1234...abcd"   (connected and correct network)

3. TxStatusBanner
 * Shows a live status strip while the MetaMask transaction is in-flight.
 *
 * Props: { status, txHash, error }
 *   status: 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error'


4. FaceCapture
 *
 * Reusable webcam component used on both RegisterPage (enroll) and LoginPage.
 *
 * Props:
 *   onCapture(base64DataUrl)  — called when user clicks "Capture"
 *   onCancel()                — called when user clicks "Cancel"
 *   title                     — heading string
 *   subtitle                  — subheading string
 *   captureLabel              — button label (default "Capture Face")
 *   processing                — bool — shows spinner instead of button
 */