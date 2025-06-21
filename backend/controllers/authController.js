import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import Company from '../models/companyModel.js';
import Student from '../models/studentModel.js';

// Helper function to generate a JWT
const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token will be valid for 30 days
    });
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

    let user;
    try {
        if (role === 'admin') {
            user = await Admin.findOne({ email });
        } else if (role === 'company') {
            user = await Company.findOne({ email });
        } else if (role === 'student') {
            user = await Student.findOne({ email });
        } else {
            return res.status(400).json({ message: 'Invalid user role specified.' });
        }

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id, role);

            // Send back user info and the token in the JSON response
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: role,
                token: token,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// --- THIS IS THE NEW FUNCTION THAT FIXES THE ERROR ---
// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
    // Your frontend handles localStorage removal. The backend's job is to
    // handle any server-side session or cookie invalidation if you use them.
    // For now, we just send a success message.
    res.status(200).json({ message: 'Logout successful' });
};


// @desc    Register a new company
// @route   POST /api/auth/company/signup
// @access  Public
export const registerCompany = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const companyExists = await Company.findOne({ email });
        if (companyExists) {
            return res.status(400).json({ message: 'Company with this email already exists.' });
        }

        const company = await Company.create({ name, email, password });
        if (company) {
             const token = generateToken(company._id, 'company');
             res.status(201).json({
                _id: company._id,
                name: company.name,
                email: company.email,
                role: 'company',
                token: token,
            });
        } else {
             res.status(400).json({ message: 'Invalid company data.' });
        }
    } catch (error) {
        console.error("Company Registration Error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// @desc    Register a new student
// @route   POST /api/auth/student/signup
// @access  Public
export const registerStudent = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const studentExists = await Student.findOne({ email });
        if (studentExists) {
            return res.status(400).json({ message: 'Student with this email already exists.' });
        }
        const student = await Student.create({ name, email, password });
        if (student) {
             const token = generateToken(student._id, 'student');
             res.status(201).json({
                _id: student._id,
                name: student.name,
                email: student.email,
                role: 'student',
                token: token,
            });
        } else {
             res.status(400).json({ message: 'Invalid student data.' });
        }
    } catch (error) {
        console.error("Student Registration Error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};