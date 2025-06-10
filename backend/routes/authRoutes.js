import express from 'express';
const router = express.Router();
import { loginUser, logoutUser } from '../controllers/authController.js';

router.post('/Login', loginUser);
router.post('/Logout', logoutUser); // We'll use this later

export default router;