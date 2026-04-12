import express from 'express';
import authenticate from '../middleware/authenticate.js';
import recordAccess from '../middleware/recordAccess.js';
import evidenceController from '../controller/evidence.controller.js';
import logsController from '../controller/logs.controller.js';
import { uploads } from '../utils/utils.js';

const router = express.Router();

router.get('/stats/overview', authenticate, evidenceController.getStats);

router.get('/logs', authenticate, logsController.fetchLogs);


// ── New MetaMask flow ─────────────────────────────────────────────────────────
router.post('/prepare-upload', authenticate, uploads.single('file'), evidenceController.handlePrepareUpload);

router.post('/confirm-upload', authenticate, evidenceController.handleConfirmUpload);

router.post('/upload', authenticate, uploads.single('file'), evidenceController.upload);


// CRUD
router.get('/', authenticate, evidenceController.getAllEvidences);
router.get('/:id', authenticate, recordAccess, evidenceController.getEvidenceById);

router.patch('/:id/status', authenticate, evidenceController.statusUpdate);

router.get('/:id/audit', authenticate, evidenceController.getAuditLog);

router.delete('/:id', authenticate, evidenceController.deleteEvidence);

export default router;