import multer from 'multer';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Upload directory (relative to project root) ───────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer: disk storage so we keep the file path ────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const uploads = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    // Accept everything — the frontend already limits types
    cb(null, true);
  },
});

// ── File-category helper ──────────────────────────────────────────────────────
export const getFileCategory = (extension) => {
  const ext = extension.toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext))           return 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext))                    return 'audio';
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'].includes(ext)) return 'document';
  return 'other';
};

// ── Rate limiter ──────────────────────────────────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// ── Auth-specific stricter limiter (for /auth routes) ─────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

// ── Blockchain contract helper ────────────────────────────────────────────────
export const getEvidenceContract = async () => {
  try {
    const { default: Web3 } = await import('web3');
    const web3 = new Web3(new Web3.providers.HttpProvider(process.env.SEPOLIA_URL));

    const rawABI = process.env.CONTRACT_ABI;
    if (!rawABI) throw new Error('CONTRACT_ABI not set in environment');

    let contractABI;
    try {
      contractABI = JSON.parse(rawABI);
    } catch {
      throw new Error('CONTRACT_ABI is not valid JSON');
    }
    if (!Array.isArray(contractABI)) throw new Error('Parsed CONTRACT_ABI is not an array');

    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress || !web3.utils.isAddress(contractAddress)) {
      throw new Error('Invalid or missing CONTRACT_ADDRESS');
    }

    return new web3.eth.Contract(contractABI, contractAddress);
      
  } catch (error) {
    console.error(`Blockchain getContract Error: ${error.message}`)
  }
};
