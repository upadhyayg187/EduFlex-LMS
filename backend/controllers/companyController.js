import Company from '../models/companyModel.js';
import Course from '../models/courseModel.js';
import Student from '../models/studentModel.js';
import Feedback from '../models/feedbackModel.js';
import { v2 as cloudinary } from 'cloudinary';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// @desc    Get statistics for the company dashboard
// @route   GET /api/companies/dashboard-stats
export const getDashboardStats = asyncHandler(async (req, res) => {
    const companyId = new mongoose.Types.ObjectId(req.user._id);

    const courses = await Course.find({ createdBy: companyId });

    if (courses.length === 0) {
        return res.json({
            totalRevenue: 0,
            totalCourses: 0,
            newStudentsCount: 0,
            averageRating: 0,
            recentReviews: []
        });
    }

    const courseIds = courses.map(c => c._id);
    const totalCourses = courses.length;

    const allStudentIds = [...new Set(courses.flatMap(course => course.students))];
    let newStudentsCount = 0;

    if (allStudentIds.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        newStudentsCount = await Student.countDocuments({
            _id: { $in: allStudentIds },
            createdAt: { $gte: thirtyDaysAgo }
        });
    }

    const ratingAggregation = await Feedback.aggregate([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingAggregation.length > 0 ? (ratingAggregation[0].avgRating || 0) : 0;

    // --- NEW: Fetch recent reviews ---
    const recentReviews = await Feedback.find({ course: { $in: courseIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('student', 'name');

    res.json({
        totalRevenue: 0,
        totalCourses,
        newStudentsCount,
        averageRating,
        recentReviews
    });
});

// --- NEW FUNCTION for the chart ---
// @desc    Get student enrollment data for a chart
// @route   GET /api/companies/dashboard-chart-data
export const getDashboardChartData = asyncHandler(async (req, res) => {
    const companyId = new mongoose.Types.ObjectId(req.user._id);
    const courses = await Course.find({ createdBy: companyId }).select('students');
    const allStudentIds = [...new Set(courses.flatMap(course => course.students))];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const studentSignups = await Student.aggregate([
        { $match: { _id: { $in: allStudentIds }, createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format data for the chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = studentSignups.map(item => ({
        name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        students: item.count
    }));

    res.json(chartData);
});


// --- Existing Functions ---

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerCompany = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const companyExists = await Company.findOne({ email });
    if (companyExists) {
        res.status(400);
        throw new Error('Company with this email already exists');
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
            createdAt: company.createdAt
        });
    } else {
        res.status(400);
        throw new Error('Invalid company data');
    }
});

export const getCompanyProfile = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id).select('-password');
    if (company) {
        res.json(company);
    } else {
        res.status(404);
        throw new Error('Company not found');
    }
});

export const updateCompanyProfile = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);
    if (company) {
        company.name = req.body.name || company.name;
        company.industry = req.body.industry || company.industry;

        if (req.body.email && req.body.email !== company.email) {
            res.status(400);
            throw new Error('Email address cannot be changed.');
        }

        if (req.file) {
            if (company.avatar && company.avatar.public_id) {
                await cloudinary.uploader.destroy(company.avatar.public_id);
            }
            company.avatar = {
                url: req.file.path,
                public_id: req.file.filename,
            };
        }

        const updatedCompany = await company.save();
        res.json({
            _id: updatedCompany._id,
            name: updatedCompany.name,
            email: updatedCompany.email,
            avatar: updatedCompany.avatar,
            industry: updatedCompany.industry,
            role: 'company',
            createdAt: updatedCompany.createdAt
        });
    } else {
        res.status(404);
        throw new Error('Company not found');
    }
});

export const updateCompanyPassword = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);
    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }
    const { currentPassword, newPassword } = req.body;
    if (!(await company.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Invalid current password');
    }
    company.password = newPassword;
    await company.save();
    res.json({ message: 'Password updated successfully' });
});

export const removeCompanyAvatar = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);
    if (company) {
        if (company.avatar && company.avatar.public_id) {
            await cloudinary.uploader.destroy(company.avatar.public_id);
            company.avatar = { url: '', public_id: '' };
            const updatedCompany = await company.save();
            res.json({
                _id: updatedCompany._id,
                name: updatedCompany.name,
                email: updatedCompany.email,
                avatar: updatedCompany.avatar,
                industry: updatedCompany.industry,
                role: 'company',
                createdAt: updatedCompany.createdAt
            });
        } else {
            res.status(400);
            throw new Error('No avatar to remove.');
        }
    } else {
        res.status(404);
        throw new Error('Company not found');
    }
});

export const getEnrolledStudents = asyncHandler(async (req, res) => {
    const companyId = new mongoose.Types.ObjectId(req.user._id);

    const enrolledStudents = await Course.aggregate([
        { $match: { createdBy: companyId } },
        { $unwind: '$students' },
        { 
            $group: { 
                _id: '$students', 
                enrolledCourseCount: { $sum: 1 } 
            } 
        },
        {
            $lookup: {
                from: 'students',
                localField: '_id',
                foreignField: '_id',
                as: 'studentDetails'
            }
        },
        { $unwind: '$studentDetails' },
        {
            $project: {
                _id: '$studentDetails._id',
                name: '$studentDetails.name',
                email: '$studentDetails.email',
                createdAt: '$studentDetails.createdAt',
                enrolledCourseCount: '$enrolledCourseCount'
            }
        }
    ]);

    res.json(enrolledStudents);
});
