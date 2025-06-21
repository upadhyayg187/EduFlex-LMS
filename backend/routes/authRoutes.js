import express from 'express';
// Correctly import all necessary functions, including the new logoutUser
import { loginUser, registerCompany, registerStudent, logoutUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser); // The route for logging out
router.post('/company/signup', registerCompany);
router.post('/student/signup', registerStudent);

export default router;