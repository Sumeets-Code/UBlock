import express from 'express';
import connectDB from '../config/mongodbconn.js';
import cors from 'cors';
import authRoutes from '../routes/auth.route.js';
import evidenceRoutes from '../routes/evidence.route.js';
import reportsRoutes from '../routes/reports.route.js';
import userRoutes from '../routes/user.route.js';
import { apiLimiter } from '../utils/utils.js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.SERVER_PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate-limit every route (must be before route registration)
app.use(apiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/evidence', evidenceRoutes);
app.use('/reports', reportsRoutes);
app.use('/user', userRoutes);

// Serve uploaded files (for file preview/download in the frontend)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ── Start: connect DB first, then listen ─────────────────────────────────────
(async () => {
  await connectDB();
  app.listen(port, () => console.log(`✅ Server running on port ${port}`));
})(); 