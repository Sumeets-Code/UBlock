import express from 'express';
import authenticate from '../middleware/authenticate.js';
import reportsController from '../controller/reports.controller.js';

const router = express.Router();

// ── Generate (live, unsaved) ──────────────────────────────────────────────────
router.get('/generate/case/:caseNumber', authenticate, reportsController.generateCase);
router.get('/generate/full',             authenticate, reportsController.generateFull);

// ── Save / list / get / delete saved reports ──────────────────────────────────
router.post('/saved',      authenticate, reportsController.save);
router.get('/saved',       authenticate, reportsController.listSaved);
router.get('/saved/:id',   authenticate, reportsController.getSaved);
router.delete('/saved/:id',authenticate, reportsController.deleteSaved);

export default router;
