// LMS/backend/routes/certificateRoutes.js

import express from 'express';
import { verifyCertificate } from '../controllers/certificateController.js'; // Import the new controller function

const router = express.Router();

// Public route for certificate verification
// @route GET /api/certificates/verify/:certificateId
router.get('/verify/:certificateId', verifyCertificate);

export default router;