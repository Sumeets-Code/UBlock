import express from 'express';
import authController from '../controller/auth.controller.js';
import { authLimiter } from '../utils/utils.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.use(authLimiter);

router.post('/register', authController.signup);
router.post('/login', authController.signin);

// ── Face auth routes (new) ────────────────────────────────────────────────────
router.post('/face/enroll', authenticate, authController.enrollFace);

router.post('/face/login', authController.faceLogin);

router.delete('/face/unenroll', authenticate, authController.unenrollFace);

export default router;