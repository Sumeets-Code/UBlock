// routes/evidence.js
import express from 'express';
import evidence_handlingController from '../controller/evidence_handling.controller.js';
import authenticate from '../middleware/authenticate.js';
import recordAccess from '../middleware/recordAccess.js';
import logsController from '../controller/logs.controller.js';
import userController from '../controller/user.controller.js';
import { uploads } from '../utils/utils.js';

const router = express.Router();

router.post('/upload', authenticate, uploads.single('file'), evidence_handlingController.upload);

router.get('/retrieve', recordAccess, evidence_handlingController.retrieve);

router.get('/getLogs', authenticate, logsController.fetchLogs);

router.post('/update', uploads.single('profilePic'), userController.updateProfile);

export default router;