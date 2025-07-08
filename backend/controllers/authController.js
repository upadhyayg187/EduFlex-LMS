import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import config from '../config/config.js';
import Admin from '../models/adminModel.js';
import Company from '../models/companyModel.js';
import Student from '../models/studentModel.js';
import Notification from '../models/notificationModel.js'; // Import Notification model

// Helper function to generate a JWT
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, config.jwtSecret, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        res.status(400); throw new Error('Please provide email, password, and role.');
    }

    let user;
    if (role === 'admin') user = await Admin.findOne({ email });
    else if (role === 'company') user = await Company.findOne({ email });
    else if (role === 'student') user = await Student.findOne({ email });
    else {
        res.status(400); throw new Error('Invalid user role specified.');
    }

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(user._id, role);
        res.status(200).json({
            _id: user._id, name: user.name, email: user.email,
            role: role, token: token, createdAt: user.createdAt,
            avatar: user.avatar, industry: user.industry
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password.');
    }
});

// @desc    Register a new user (student or company)
// @route   POST /api/auth/signup
export const signupUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        res.status(400); throw new Error('Please provide name, email, password, and role.');
    }

    let UserModel;
    if (role === 'company') UserModel = Company;
    else if (role === 'student') UserModel = Student;
    else {
        res.status(400); throw new Error('Invalid role for signup.');
    }

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error(`${role.charAt(0).toUpperCase() + role.slice(1)} already exists.`);
    }

    const user = await UserModel.create({ name, email, password });

    if (user) {
        // --- FIX: Create notification for admin on new company signup ---
        if (role === 'company') {
            const admins = await Admin.find({}).select('_id');
            if (admins.length > 0) {
                const notifications = admins.map(admin => ({
                    recipient: admin._id,
                    recipientModel: 'Admin',
                    message: `A new company, '${user.name}', has signed up and is pending approval.`,
                    link: `/admin/companies`,
                    type: 'new_company'
                }));
                await Notification.create(notifications);
            }
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            message: 'User registered successfully. Please login.'
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data.');
    }
});


// @desc    Logout user
export const logoutUser = (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
};