import asyncHandler from 'express-async-handler';
import Student from '../models/studentModel.js';
import Course from '../models/courseModel.js';
import Assignment from '../models/assignmentModel.js';
import Submission from '../models/submissionModel.js';
import Notification from '../models/notificationModel.js';
import Progress from '../models/progressModel.js';
import { v2 as cloudinary } from 'cloudinary';
import  generateToken  from '../utils/generateToken.js';

// --- THIS FUNCTION IS NOW UPDATED ---
// @desc    Get all courses a student is enrolled in, including progress
// @route   GET /api/students/my-courses
export const getEnrolledCourses = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    const enrolledCourses = await Course.find({ students: studentId })
        .populate('createdBy', 'name')
        .select('title thumbnail level createdBy curriculum')
        .lean();

    // Fetch all progress data for the student in one go for efficiency
    const progressData = await Progress.find({ student: studentId });
    const progressMap = new Map(progressData.map(p => [p.course.toString(), p.lessonProgress]));

    // Combine course data with calculated progress
    const coursesWithProgress = enrolledCourses.map(course => {
        const lessonProgress = progressMap.get(course._id.toString()) || [];
        const totalLessons = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);
        const completedCount = lessonProgress.filter(lp => lp.isCompleted).length;
        const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        
        return {
            _id: course._id,
            title: course.title,
            thumbnail: course.thumbnail,
            level: course.level,
            createdBy: course.createdBy,
            progress: progressPercentage,
        };
    });

    res.json(coursesWithProgress);
});


// --- Other functions ---

export const getDashboardData = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const enrolledCourses = await Course.find({ students: studentId }).sort({ updatedAt: -1 }).limit(5).select('title thumbnail level');
    const enrolledCoursesCount = await Course.countDocuments({ students: studentId });
    const courseIds = enrolledCourses.map(c => c._id);
    const assignments = await Assignment.find({ course: { $in: courseIds } });
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({ student: studentId, assignment: { $in: assignmentIds } });
    const submittedAssignmentIds = submissions.map(s => s.assignment.toString());
    const assignmentsCompletedCount = submittedAssignmentIds.length;
    const assignmentsPendingCount = assignments.length - assignmentsCompletedCount;
    res.json({
        enrolledCoursesCount,
        assignmentsCompletedCount,
        assignmentsPendingCount,
        recentCourses: enrolledCourses
    });
});

export const saveCourseProgress = asyncHandler(async (req, res) => {
    const { courseId, lessonId, isCompleted, timestamp } = req.body;
    const studentId = req.user._id;
    if (!courseId || !lessonId) { res.status(400); throw new Error('Course ID and Lesson ID are required.'); }
    let progress = await Progress.findOne({ student: studentId, course: courseId });
    if (!progress) {
        progress = new Progress({ student: studentId, course: courseId, lessonProgress: [] });
    }
    const lessonIndex = progress.lessonProgress.findIndex((lp) => lp.lessonId.toString() === lessonId);
    if (lessonIndex > -1) {
        if (timestamp !== undefined) { progress.lessonProgress[lessonIndex].lastTimestamp = timestamp; }
        if (isCompleted === true) { progress.lessonProgress[lessonIndex].isCompleted = true; }
    } else {
        progress.lessonProgress.push({ lessonId, isCompleted: !!isCompleted, lastTimestamp: timestamp || 0 });
    }
    progress.markModified('lessonProgress');
    const updatedProgress = await progress.save();
    res.status(200).json(updatedProgress);
});

export const getMyProgressOverview = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const enrolledCourses = await Course.find({ students: studentId }).populate('createdBy', 'name').select('title thumbnail curriculum createdBy').lean();
    const progressData = await Progress.find({ student: studentId });
    const progressMap = new Map(progressData.map(p => [p.course.toString(), p.lessonProgress]));
    const coursesWithProgress = enrolledCourses.map(course => {
        const lessonProgress = progressMap.get(course._id.toString()) || [];
        const totalLessons = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);
        const completedCount = lessonProgress.filter(lp => lp.isCompleted).length;
        const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
        return {
            _id: course._id,
            title: course.title,
            thumbnail: course.thumbnail,
            progress: progressPercentage,
            instructor: course.createdBy.name,
        };
    });
    res.json(coursesWithProgress);
});

export const getStudentAssignments = asyncHandler(async (req, res) => {
    const studentId = req.user._id;
    const enrolledCourses = await Course.find({ students: studentId }).select('_id');
    const courseIds = enrolledCourses.map(c => c._id);
    if (courseIds.length === 0) { return res.json([]); }
    const assignments = await Assignment.find({ course: { $in: courseIds } }).populate('course', 'title').sort({ dueDate: 1 }).lean();
    const submissions = await Submission.find({ student: studentId }).lean();
    const submissionMap = new Map(submissions.map(s => [s.assignment.toString(), s]));
    const assignmentsWithStatus = assignments.map(assignment => {
        const submission = submissionMap.get(assignment._id.toString());
        return {
            ...assignment,
            status: submission ? submission.status : 'To Do',
            submission: submission || null,
        };
    });
    res.json(assignmentsWithStatus);
});

export const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const studentExists = await Student.findOne({ email });
  if (studentExists) { res.status(400); throw new Error('Student already exists'); }
  const student = await Student.create({ name, email, password });
  if (student) {
    generateToken(res, student._id, 'student');
    res.status(201).json({ _id: student._id, name: student.name, email: student.email, role: 'student', createdAt: student.createdAt });
  } else {
    res.status(400); throw new Error('Invalid student data');
  }
});

export const getStudentProfile = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.user._id).select('-password');
    if (student) {
        res.json(student);
    } else {
        res.status(404);
        throw new Error('Student not found');
    }
});

export const updateProfile = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.user._id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    student.name = req.body.name || student.name;
    if (req.file) {
        if (student.avatar && student.avatar.public_id) {
            await cloudinary.uploader.destroy(student.avatar.public_id);
        }
        student.avatar = {
            url: req.file.path,
            public_id: req.file.filename,
        };
    }
    const updatedStudent = await student.save();
    res.json({
        _id: updatedStudent._id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        avatar: updatedStudent.avatar,
        role: 'student',
        createdAt: updatedStudent.createdAt
    });
});

export const updateStudentPassword = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.user._id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    const { currentPassword, newPassword } = req.body;
    if (!(await student.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Invalid current password');
    }
    student.password = newPassword;
    await student.save();
    res.json({ message: 'Password updated successfully' });
});

export const removeStudentAvatar = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.user._id);
    if (student) {
        if (student.avatar && student.avatar.public_id) {
            await cloudinary.uploader.destroy(student.avatar.public_id);
            student.avatar = { url: '', public_id: '' };
            const updatedStudent = await student.save();
             res.json({
                _id: updatedStudent._id,
                name: updatedStudent.name,
                email: updatedStudent.email,
                avatar: updatedStudent.avatar,
                role: 'student',
                createdAt: updatedStudent.createdAt
            });
        } else {
            res.status(400);
            throw new Error('No avatar to remove.');
        }
    } else {
        res.status(404);
        throw new Error('Student not found');
    }
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});
