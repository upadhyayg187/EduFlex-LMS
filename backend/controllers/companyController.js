import Company from '../models/companyModel.js';
import Course from '../models/courseModel.js';
import Student from '../models/studentModel.js';
import Feedback from '../models/feedbackModel.js';
import { v2 as cloudinary } from 'cloudinary';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';

// --- THIS FUNCTION IS NOW UPDATED ---
// @desc    Get all students enrolled in the company's courses, including the list of courses
// @route   GET /api/companies/students
export const getEnrolledStudents = asyncHandler(async (req, res) => {
    const companyId = new mongoose.Types.ObjectId(req.user._id);

    const enrolledStudents = await Course.aggregate([
        { $match: { createdBy: companyId } },
        { $unwind: '$students' },
        { 
            $group: { 
                _id: '$students', 
                enrolledCourses: { $push: { _id: '$_id', title: '$title' } } // Collect course details
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
                enrolledCourseCount: { $size: '$enrolledCourses' }, // Count the courses
                enrolledCoursesList: '$enrolledCourses' // Include the list of courses
            }
        },
        { $sort: { 'studentDetails.createdAt': -1 } }
    ]);

    res.json(enrolledStudents);
});


// --- Other functions remain the same ---
export const getDashboardStats = asyncHandler(async (req, res) => {
    const companyId = new mongoose.Types.ObjectId(req.user._id);
    const courses = await Course.find({ createdBy: companyId });
    if (courses.length === 0) { return res.json({ totalRevenue: 0, totalCourses: 0, newStudentsCount: 0, averageRating: 0, recentReviews: [] }); }
    const courseIds = courses.map(c => c._id);
    const totalCourses = courses.length;
    const allStudentIds = [...new Set(courses.flatMap(course => course.students))];
    let newStudentsCount = 0;
    if (allStudentIds.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        newStudentsCount = await Student.countDocuments({ _id: { $in: allStudentIds }, createdAt: { $gte: thirtyDaysAgo } });
    }
    const ratingAggregation = await Feedback.aggregate([ { $match: { course: { $in: courseIds } } }, { $group: { _id: null, avgRating: { $avg: '$rating' } } } ]);
    const averageRating = ratingAggregation.length > 0 ? (ratingAggregation[0].avgRating || 0) : 0;
    const recentReviews = await Feedback.find({ course: { $in: courseIds } }).sort({ createdAt: -1 }).limit(5).populate('student', 'name');
    res.json({ totalRevenue: 0, totalCourses, newStudentsCount, averageRating, recentReviews });
});
export const getDashboardChartData = asyncHandler(async (req, res) => {
    const companyId = new mongoose.Types.ObjectId(req.user._id);
    const courses = await Course.find({ createdBy: companyId }).select('students');
    const allStudentIds = [...new Set(courses.flatMap(course => course.students))];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const studentSignups = await Student.aggregate([
        { $match: { _id: { $in: allStudentIds }, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = studentSignups.map(item => ({ name: `${monthNames[item._id.month - 1]} ${item._id.year}`, students: item.count }));
    res.json(chartData);
});
export const getCompanyProfile = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id).select('-password');
    if (company) { res.json(company); } 
    else { res.status(404); throw new Error('Company not found'); }
});
export const updateCompanyProfile = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);
    if (company) {
        company.name = req.body.name || company.name;
        company.industry = req.body.industry || company.industry;
        if (req.file) {
            if (company.avatar && company.avatar.public_id) {
                await cloudinary.uploader.destroy(company.avatar.public_id);
            }
            company.avatar = { url: req.file.path, public_id: req.file.filename };
        }
        const updatedCompany = await company.save();
        res.json({ _id: updatedCompany._id, name: updatedCompany.name, email: updatedCompany.email, avatar: updatedCompany.avatar, industry: updatedCompany.industry, role: 'company', createdAt: updatedCompany.createdAt });
    } else { res.status(404); throw new Error('Company not found'); }
});
export const updateCompanyPassword = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);
    if (!company) { res.status(404); throw new Error('Company not found'); }
    const { currentPassword, newPassword } = req.body;
    if (!(await company.matchPassword(currentPassword))) {
        res.status(401); throw new Error('Invalid current password');
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
             res.json({ _id: updatedCompany._id, name: updatedCompany.name, email: updatedCompany.email, avatar: updatedCompany.avatar, industry: updatedCompany.industry, role: 'company', createdAt: updatedCompany.createdAt });
        } else { res.status(400); throw new Error('No avatar to remove.'); }
    } else { res.status(404); throw new Error('Company not found'); }
});
export const getStudentProfileForCompany = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const companyId = req.user._id;
    const courseWithStudent = await Course.findOne({ createdBy: companyId, students: studentId });
    if (!courseWithStudent) { res.status(403); throw new Error("You are not authorized to view this student's profile."); }
    const student = await Student.findById(studentId).select('-password');
    if (!student) { res.status(404); throw new Error('Student not found'); }
    res.json(student);
});
export const removeStudentFromCourses = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const companyId = req.user._id;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const companyCourses = await Course.find({ createdBy: companyId }).select('_id').session(session);
        const courseIds = companyCourses.map(c => c._id);
        await Course.updateMany({ _id: { $in: courseIds } }, { $pull: { students: studentId } }, { session });
        await Student.updateOne({ _id: studentId }, { $pull: { enrolledCourses: { $in: courseIds } } }, { session });
        await session.commitTransaction();
        res.json({ message: 'Student removed from courses successfully.' });
    } catch (error) {
        await session.abortTransaction();
        throw new Error('Failed to remove student from courses.');
    } finally {
        session.endSession();
    }
});
