import express from 'express';
import authenticate from '../middleware/authenticate.js';
import userController from '../controller/user.controller.js';
import { uploads } from '../utils/utils.js';

const router = express.Router();

// GET /user/profile  — fetch logged-in user's profile
router.get('/profile', authenticate, userController.getProfile);

// PATCH /user/profile  — update name, contact, department, badgeNumber, photo
router.patch('/profile', authenticate, uploads.single('profilePic'), userController.updateProfile);

export default router;
