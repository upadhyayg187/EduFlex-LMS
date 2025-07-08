import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Admin from '../models/adminModel.js';
import Company from '../models/companyModel.js';
import Student from '../models/studentModel.js';
import Course from '../models/courseModel.js';
import Settings from '../models/settingsModel.js';
import Feedback from '../models/feedbackModel.js';
import Assignment from '../models/assignmentModel.js';
import Submission from '../models/submissionModel.js';
import Progress from '../models/progressModel.js';
import { v2 as cloudinary } from 'cloudinary';

// --- NEW FUNCTION ---
// @desc    Get platform settings
// @route   GET /api/admins/settings
export const getPlatformSettings = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne({ key: 'platformSettings' });
    if (!settings) {
        settings = await Settings.create({});
    }
    res.json(settings);
});

// --- NEW FUNCTION ---
// @desc    Update platform settings
// @route   PUT /api/admins/settings
export const updatePlatformSettings = asyncHandler(async (req, res) => {
    const { platformName } = req.body;
    let settings = await Settings.findOne({ key: 'platformSettings' });
    if (!settings) {
        settings = await Settings.create({ platformName });
    }

    settings.platformName = platformName || settings.platformName;

    if (req.file) {
        if (settings.logo && settings.logo.public_id) {
            await cloudinary.uploader.destroy(settings.logo.public_id);
        }
        settings.logo = {
            url: req.file.path,
            public_id: req.file.filename,
        };
    }
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
});

// --- NEW FUNCTION ---
// @desc    Update admin password
// @route   PUT /api/admins/change-password
export const updateAdminPassword = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }
    const { currentPassword, newPassword } = req.body;
    if (!(await admin.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Invalid current password');
    }
    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated successfully' });
});


// --- Existing Functions ---

export const getAllCompanies = asyncHandler(async (req, res) => {
    const companies = await Company.aggregate([
        { $lookup: { from: 'courses', localField: '_id', foreignField: 'createdBy', as: 'courses' } },
        { $project: {
            name: 1, email: 1, createdAt: 1, status: 1,
            courseCount: { $size: '$courses' },
            totalStudents: { $size: { $reduce: { input: '$courses.students', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } } }
        }},
        { $sort: { createdAt: -1 } }
    ]);
    res.json(companies);
});

export const deleteCompanyAndContent = asyncHandler(async (req, res) => {
    const companyId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const coursesToDelete = await Course.find({ createdBy: companyId }).session(session);
        if (coursesToDelete.length > 0) {
            const courseIds = coursesToDelete.map(c => c._id);
            const publicIdsToDelete = [];
            coursesToDelete.forEach(course => {
                if (course.thumbnail?.public_id) publicIdsToDelete.push(course.thumbnail.public_id);
                course.curriculum.forEach(section => {
                    section.lessons.forEach(lesson => {
                        if (lesson.videoPublicId) publicIdsToDelete.push(lesson.videoPublicId);
                    });
                });
            });
            if (publicIdsToDelete.length > 0) {
                await cloudinary.api.delete_resources(publicIdsToDelete, { resource_type: 'image' });
                await cloudinary.api.delete_resources(publicIdsToDelete, { resource_type: 'video' });
            }
            const assignmentIds = (await Assignment.find({ course: { $in: courseIds } }).select('_id')).map(a => a._id);
            await Submission.deleteMany({ assignment: { $in: assignmentIds } }, { session });
            await Assignment.deleteMany({ course: { $in: courseIds } }, { session });
            await Feedback.deleteMany({ course: { $in: courseIds } }, { session });
            await Progress.deleteMany({ course: { $in: courseIds } }, { session });
            await Student.updateMany({}, { $pull: { enrolledCourses: { $in: courseIds } } }, { session });
            await Course.deleteMany({ _id: { $in: courseIds } }, { session });
        }
        const company = await Company.findByIdAndDelete(companyId).session(session);
        if (!company) { throw new Error('Company not found'); }
        await session.commitTransaction();
        res.json({ message: 'Company and all associated content deleted successfully.' });
    } catch (error) {
        await session.abortTransaction();
        throw new Error('Failed to delete company and its content.');
    } finally {
        session.endSession();
    }
});

export const updateCompanyStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Active', 'Suspended'];
    if (!validStatuses.includes(status)) { res.status(400); throw new Error('Invalid status provided.'); }
    const company = await Company.findById(req.params.id);
    if (!company) { res.status(404); throw new Error('Company not found.'); }
    company.status = status;
    await company.save();
    res.json({ message: `Company status updated to ${status}` });
});

export const getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.aggregate([
        { $project: { name: 1, email: 1, createdAt: 1, avatar: 1, enrolledCourseCount: { $size: { $ifNull: ["$enrolledCourses", []] } } } },
        { $sort: { createdAt: -1 } }
    ]);
    res.json(students);
});

export const deleteStudent = asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const student = await Student.findById(studentId).session(session);
        if (!student) { throw new Error('Student not found'); }
        await Course.updateMany({ _id: { $in: student.enrolledCourses } }, { $pull: { students: studentId } }, { session });
        await Progress.deleteMany({ student: studentId }, { session });
        await Submission.deleteMany({ student: studentId }, { session });
        await Feedback.deleteMany({ student: studentId }, { session });
        await Student.findByIdAndDelete(studentId).session(session);
        await session.commitTransaction();
        res.json({ message: 'Student and all associated data deleted successfully.' });
    } catch (error) {
        await session.abortTransaction();
        throw new Error('Failed to delete student.');
    } finally {
        session.endSession();
    }
});

export const getAllCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({}).populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(courses);
});

export const deleteCourseByAdmin = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) { res.status(404); throw new Error('Course not found.'); }
    if (course.thumbnail?.public_id) { await cloudinary.uploader.destroy(course.thumbnail.public_id); }
    if (course.curriculum?.length > 0) {
        const videoPublicIds = course.curriculum.flatMap(s => s.lessons).map(l => l.videoPublicId).filter(Boolean);
        if (videoPublicIds.length > 0) {
            await cloudinary.api.delete_resources(videoPublicIds, { resource_type: 'video' });
        }
    }
    const courseId = course._id;
    const assignmentIds = (await Assignment.find({ course: courseId }).select('_id')).map(a => a._id);
    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    await Assignment.deleteMany({ course: courseId });
    await Feedback.deleteMany({ course: courseId });
    await Progress.deleteMany({ course: courseId });
    await Student.updateMany({ enrolledCourses: courseId }, { $pull: { enrolledCourses: courseId } });
    await course.deleteOne();
    res.json({ message: 'Course and all associated content deleted successfully.' });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
    const totalCompanies = await Company.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalRevenue = 0; 
    const recentCompanies = await Company.find({}).sort({ createdAt: -1 }).limit(5).select('name email createdAt');
    res.json({ totalCompanies, totalStudents, totalCourses, totalRevenue, recentCompanies });
});
