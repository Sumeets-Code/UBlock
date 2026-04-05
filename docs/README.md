<div align="center">

# 🛡 UBlock — Evidence Management System

**Blockchain-secured · IPFS-stored · AI-authenticated**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat-square&logo=ethereum)](https://sepolia.etherscan.io)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=flat-square&logo=ipfs)](https://pinata.cloud)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

*A tamper-proof digital evidence vault for law enforcement — every file is pinned to IPFS, every access is recorded on Ethereum, and every officer is authenticated by face.*

</div>

---

## What is UBlock?

UBlock is a full-stack evidence management platform built for law enforcement and forensic teams. It replaces shared network drives and paper logs with a system where:

- **Files cannot be tampered with** — every upload goes to IPFS and its SHA-256 hash is written immutably to an Ethereum smart contract
- **Every action is auditable** — access, status changes and deletions are recorded as on-chain events, creating a permanent chain of custody
- **Officers are verified by face** — login and registration include optional biometric authentication powered by a Python ML microservice
- **Users pay their own gas** — officers connect MetaMask and sign their own blockchain registration, making their wallet address the permanent on-chain proof of upload

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│  LoginPage · RegisterPage · EvidencePage · UploadPage           │
│  ReportsPage · Dashboard · EvidenceDetail                       │
│                                                                 │
│  WalletProvider (MetaMask) · AuthProvider · ToastProvider       │
└────────────────┬────────────────────────────────────────────────┘
                 │ REST API  (/api/...)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express.js API                             │
│                                                                 │
│  /auth     → register, login, face enroll/login/unenroll        │
│  /evidence → CRUD, upload, stats, audit log                     │
│  /reports  → generate, save, list, view, delete, PDF            │
│  /user     → profile, photo                                     │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐    │
│  │ MongoDB  │  │   IPFS   │  │ Ethereum  │  │  Face ML     │    │
│  │(Mongoose)│  │(Pinata)  │  │(ethers v6)│  │  Service     │    │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                    │                   │
                 ┌──────────────────┘                   │ REST API  (/face_api/)
                 ▼                                      ▼
┌──────────────────────────┐         ┌───────────────────────────┐
│   EvidenceVault.sol      │         │  Python Face Service      │
│   (Sepolia Testnet)      │         │  (FastAPI + PyTorch)      │
│                          │         │                           │
│  registerEvidenceByUser  │         │  MTCNN face detection     │
│  recordAccess            │         │  InceptionResnetV1        │
│  recordCustodyEvent      │         │  (VGGFace2, 99.65% acc.)  │
│  deleteEvidence          │         │  512-d cosine similarity  │
│  verifyIntegrity         │         │  Thread-safe pickle store │
└──────────────────────────┘         └───────────────────────────┘
```

---

## Features

### Evidence Management
- Upload any file type up to 100 MB with full metadata (case number, officer, date, location, tags)
- Files are pinned to IPFS via Pinata — content-addressed, permanent, censorship-resistant
- SHA-256 hash stored alongside the IPFS CID for local integrity verification
- Grid and list views, full-text search, filter by category and status
- Evidence detail page with file preview (images, video, audio, PDF), chain of custody timeline

### Blockchain Audit Trail
- Every evidence upload registers the IPFS hash on Ethereum as a `bytes32` value (1 storage slot, gas-optimised)
- Chain-of-custody events (access, status change, delete) are emitted as Solidity events — costs ~375 gas vs ~20,000 for on-chain array storage
- **Two payment modes:** operator wallet pays gas silently, OR officers connect MetaMask and pay themselves (their wallet address becomes the permanent on-chain uploader)
- EIP-1559 gas pricing — `maxFeePerGas = 2×baseFee + tip` minimises cost; unused gas is refunded
- Nonce mutex in the backend prevents `already known` errors from concurrent transactions

### Face Recognition Authentication
- Optional biometric layer on top of password auth
- Python FastAPI microservice using MTCNN (face detection) + InceptionResnetV1/VGGFace2 (512-d embeddings)
- 99.65% accuracy on the LFW benchmark
- 1-to-1 verification at login: cosine similarity against up to 3 stored face samples per user
- Runs entirely on CPU — no GPU required
- Service-to-service authentication via `X-Service-Secret` header

### Reports
- Generate case reports (by case number) or full system reports
- Save reports as MongoDB snapshots — immutable after saving, persists even if evidence is later modified
- Filterable sidebar of all saved reports
- PDF export with evidence table, statistics, chain of custody, and Etherscan links (jsPDF + jspdf-autotable)

### Security
- Argon2id password hashing
- JWT authentication with 48-hour expiry and automatic 401 handling
- Global rate limiting (100 req/15 min) with stricter auth-endpoint limiting (20 req/15 min)
- CORS restricted to configured client URL
- Passwords stripped from all API responses via `sanitizeUser()`
- `.env` excluded from version control

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Axios, jsPDF |
| Backend | Node.js 20, Express.js, Mongoose |
| Database | MongoDB |
| Blockchain | Solidity 0.8.24, Hardhat, ethers.js v6 |
| Storage | IPFS via Pinata (kubo-rpc-client) |
| Face AI | Python 3.11, FastAPI, PyTorch, facenet-pytorch |
| Auth | JWT (jsonwebtoken), Argon2id, MetaMask |
| Email | Nodemailer |
| Logging | Winston + daily-rotate-file |

---

## Project Structure

```
UBlock/
├── client/                             ← React frontend (Vite)
│   └── src/
│       ├── pages/                      Dashboard, Evidence, Upload, Reports, Login, Register
│       ├── components/                 Layout, WalletButton, WalletConnectModal, FaceCapture
│       ├── context/                    AuthProvider, WalletProvider, ToastProvider
│       ├── hooks/                      useBlockchain, useWebcam
│       └── utils/                      api.js (axios instance + helpers)
│
├── backend/
│   ├── api/                            ← Express backend
│   │   ├── config/                     jwtProvider, mongodbconn
│   │   ├── controller/                 auth, evidence, reports, user, logs
│   │   ├── middleware/                 authenticate, recordAccess
│   │   ├── models/                     User, Evidence, Report
│   │   ├── routes/                     auth, evidence, reports, user
│   │   ├── services/                   evidence, blockchain, ipfs, face, user, email
│   │   └── src/server.js
│   │
│   └── blockchain/                     ← Hardhat project
│       ├── contracts/EvidenceVault.sol
│       ├── scripts/deploy.js
│       ├── test/EvidenceVault.test.js
│       └── ipfs_service/ipfs.service.js
│
└── face-service/                       ← Python microservice
    └── app/
        ├── core/                       config, encoder, face_store, security
        ├── routers/                    register, recognize, health
        └── models/schemas.py
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Python 3.10+
- MongoDB (local or Atlas)
- [Alchemy](https://alchemy.com) account (free) — Sepolia RPC
- [Pinata](https://pinata.cloud) account (free) — IPFS pinning
- MetaMask browser extension

### 1. Clone and install

```bash
git clone https://github.com/yourusername/ublock.git
cd ublock

# Backend
cd api && npm install

# Frontend
cd ../client && npm install

# Blockchain
cd ../blockchain && npm install

# Face service
cd ../face-service && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment variables

**`api/src/.env`**
```env
SERVER_PORT=3000
CLIENT_URL=http://localhost:5173
MONGO_URI=<YOUR_MONGO_URI_STRING>
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET_KEY=<64-byte-hex>        
SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_KEY>
OPERATOR_PRIVATE_KEY=0x<YOUR_WALLET_PRIVATE_KEY>
PINATA_JWT=<YOUR_PINATA_JWT>
FACE_RECOGNITION_URL=http://localhost:8000
FACE_SERVICE_SECRET=<shared-secret>   # must match face-service/.env
```

**`face-service/.env`**
```env
SERVICE_SECRET=<same-shared-secret>
SIMILARITY_THRESHOLD=0.55
```

**`client/.env`**
```env
VITE_CONTRACT_ADDRESS=<deployed-contract-address>
```

### 3. Deploy the smart contract

```bash
cd blockchain
npm run compile
npm test                    # 7 tests, ~5 seconds
npm run deploy:sepolia      # writes api/blockchain/deployment.json
```

### 4. Start all services

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Backend API
cd backend/api/src && npm run dev

# Terminal 3 — Face recognition service
cd face-service && bash start.sh

# Terminal 4 — Frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Smart Contract

**EvidenceVault** (`EvidenceVault.sol`) deployed on Sepolia Testnet.

### Gas cost reference

| Operation | Gas | Cost at 10 gwei | Who pays |
|---|---|---|---|
| `registerEvidenceByUser` | ~85,000 | ~$0.003 | Officer's MetaMask |
| `recordAccess` event | ~28,000 | ~$0.001 | Operator |
| `recordCustodyEvent` | ~32,000 | ~$0.001 | Operator |
| `deleteEvidence` | ~35,000 | ~$0.001 | Operator |
| `getEvidence` / `verifyIntegrity` | 0 | Free | — |

### Key design decisions

- **`bytes32` for IPFS hash** — CIDv1 sha2-256 digest fits in 32 bytes (1 storage slot). Using `string` would cost 3× more gas.
- **Events for custody logs** — emitting a `CustodyEvent` costs ~375 gas; writing to an on-chain array costs ~20,000. All history is queryable off-chain via `eth_getLogs`.
- **`uint64` timestamps** — packed with `bool deleted` and `address uploadedBy` into 2 storage slots instead of 3.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Password login |
| POST | `/auth/face/enroll` | JWT | Enroll face sample |
| POST | `/auth/face/login` | — | Face ID login |
| GET | `/evidence` | JWT | List with filters |
| GET | `/evidence/stats/overview` | JWT | Dashboard stats |
| POST | `/evidence/prepare-upload` | JWT | Upload to IPFS (step 1) |
| POST | `/evidence/confirm-upload` | JWT | Confirm blockchain tx (step 2) |
| POST | `/evidence/upload` | JWT | Operator-pays upload |
| GET | `/evidence/:id` | JWT | Get + log access on-chain |
| PATCH | `/evidence/:id/status` | JWT | Update + custody event |
| GET | `/evidence/:id/audit` | JWT | Full blockchain audit log |
| DELETE | `/evidence/:id` | JWT | Soft-delete on-chain |
| GET | `/reports/generate/case/:num` | JWT | Generate case report |
| GET | `/reports/generate/full` | JWT | Generate full report |
| POST | `/reports/saved` | JWT | Save report snapshot |
| GET | `/reports/saved` | JWT | List saved reports |
| DELETE | `/reports/saved/:id` | JWT | Delete saved report |

---

## Contributors

| Name | Role |
|---|---|
| Sumeet Bhagat | Backend, Blockchain, IPFS, System Architecture |
| Shreyash Gardi & Bhanavi Pandey | Frontend Development |
| Anoushka Ingle | Testing |

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built with ❤️ for tamper-proof evidence management
</div>
