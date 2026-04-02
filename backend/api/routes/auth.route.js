import express from 'express';
import authController from '../controller/auth.controller.js';
import { authLimiter } from '../utils/utils.js';

const router = express.Router();

router.use(authLimiter);

router.post('/register', authController.signup);
router.post('/login', authController.signin);

export default router;