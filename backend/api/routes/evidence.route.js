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

// CRUD
router.get('/',    authenticate, evidenceController.getAllEvidences);
router.get('/:id', authenticate, recordAccess, evidenceController.getEvidenceById);

router.post('/upload', authenticate, uploads.single('file'), evidenceController.upload);

// Frontend calls PATCH /evidence/:id/status
router.patch('/:id/status', authenticate, evidenceController.statusUpdate);

router.delete('/:id', authenticate, evidenceController.deleteEvidence);

export default router;
