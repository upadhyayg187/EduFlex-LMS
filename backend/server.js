import dotenv from 'dotenv';
// --- THIS IS THE FIX ---
// Load environment variables right at the top, before any other imports.
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import supportRoutes from './routes/supportRoutes.js'; // <-- ADD THIS LINE
import aiSupportRoutes from './routes/aiSupportRoutes.js'; // <-- ADD THIS LINE

// import adminRoutes from './routes/adminRoutes.js';

// Connect to the database
connectDB();

const app = express();

// CORS configuration to allow credentials from your frontend
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(cookieParser()); // To parse cookies

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes); // <-- ADD THIS LINE
app.use('/api/ai-support', aiSupportRoutes);

// app.use('/api/admin', adminRoutes);

// Test Route
app.get('/', (req, res) => res.send('API is running successfully...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));