import express from 'express';
import authenticate from '../middleware/authenticate.js';
import recordAccess from '../middleware/recordAccess.js';
import evidenceController from '../controller/evidence.controller.js';
import logsController from '../controller/logs.controller.js';
import { uploads } from '../utils/utils.js';

const router = express.Router();

// Stats — must be registered BEFORE /:id or Express matches "stats" as an id
router.get('/stats/overview', authenticate, evidenceController.getStats);

// Logs
router.get('/logs', authenticate, logsController.fetchLogs);


// ── New MetaMask flow ─────────────────────────────────────────────────────────
// Step 1: upload file to IPFS → get data for MetaMask signing
router.post('/prepare-upload', authenticate, uploads.single('file'), evidenceController.handlePrepareUpload);

// Step 2: frontend confirmed tx → finalise MongoDB record
router.post('/confirm-upload', authenticate, evidenceController.handleConfirmUpload);


// CRUD
router.get('/', authenticate, evidenceController.getAllEvidences);
router.get('/:id', authenticate, recordAccess, evidenceController.getEvidenceById);

// Frontend calls PATCH /evidence/:id/status
router.patch('/:id/status', authenticate, evidenceController.statusUpdate);

router.get('/:id/audit', authenticate, evidenceController.getAuditLog);

router.delete('/:id', authenticate, evidenceController.deleteEvidence);

export default router;
