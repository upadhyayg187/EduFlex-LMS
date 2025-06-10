import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
// import adminRoutes from './routes/adminRoutes.js'; // Will use later
import courseRoutes from './routes/courseRoutes.js';

dotenv.config();
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
app.use('/api/students', studentRoutes);
app.use('/api/companies', companyRoutes);
// app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes); 

app.get('/', (req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));