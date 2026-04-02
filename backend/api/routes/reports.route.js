import express from 'express';
import authenticate from '../middleware/authenticate.js';
import reportsController from '../controller/reports.controller.js';

const router = express.Router();

router.get('/case/:id', authenticate, reportsController.getCaseReport);

router.get('/full', authenticate, reportsController.getFullReport);

export default router;