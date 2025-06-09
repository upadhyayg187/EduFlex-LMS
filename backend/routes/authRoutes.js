import express from 'express';
const router = express.Router();
import { loginUser, logoutUser } from '../controllers/authController.js';

router.post('/login', loginUser);
router.post('/logout', logoutUser); // We'll use this later

export default router;