import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/config.js';
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import aiSupportRoutes from './routes/aiSupportRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

connectDB();
const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/ai-support', aiSupportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admins', adminRoutes);


app.get('/', (req, res) => res.send('API is running successfully...'));

const PORT = config.port;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
