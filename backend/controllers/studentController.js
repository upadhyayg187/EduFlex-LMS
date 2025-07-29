// LMS/backend/controllers/studentController.js

import asyncHandler from 'express-async-handler';
import Student from '../models/studentModel.js';
import Course from '../models/courseModel.js';
import Assignment from '../models/assignmentModel.js';
import Submission from '../models/submissionModel.js';
import Notification from '../models/notificationModel.js';
import Progress from '../models/progressModel.js';
import Certificate from '../models/certificateModel.js'; // Import Certificate model
import generateCertificatePDF from '../utils/generateCertificatePDF.js'; // Import PDF generator
import Settings from '../models/settingsModel.js'; // Import Settings for platform name/logo
import { v2 as cloudinary } from 'cloudinary';
import  generateToken  from '../utils/generateToken.js';

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


// --- UPDATED FUNCTION FOR CERTIFICATE GENERATION ---
// @desc    Save course progress and trigger certificate generation if course completed
// @route   POST /api/students/progress
// @access  Private/Student
export const saveCourseProgress = asyncHandler(async (req, res) => {
    const { courseId, lessonId, isCompleted, timestamp } = req.body;
    const studentId = req.user._id;

    if (!courseId || !lessonId) {
        res.status(400);
        throw new Error('Course ID and Lesson ID are required.');
    }

    // Find or create progress document
    let progress = await Progress.findOne({ student: studentId, course: courseId });
    if (!progress) {
        progress = new Progress({ student: studentId, course: courseId, lessonProgress: [] });
    }

    // Update or add lesson progress
    const lessonIndex = progress.lessonProgress.findIndex((lp) => lp.lessonId.toString() === lessonId);
    if (lessonIndex > -1) {
        if (timestamp !== undefined) { progress.lessonProgress[lessonIndex].lastTimestamp = timestamp; }
        if (isCompleted === true) { progress.lessonProgress[lessonIndex].isCompleted = true; }
    } else {
        progress.lessonProgress.push({ lessonId, isCompleted: !!isCompleted, lastTimestamp: timestamp || 0 });
    }
    progress.markModified('lessonProgress'); // Mark as modified for nested arrays

    const updatedProgress = await progress.save();

    // --- Certificate Generation Logic ---
    // Check if the course offers a certificate and if all lessons are completed
    const course = await Course.findById(courseId).populate('createdBy', 'name'); // Populate instructor name
    const student = await Student.findById(studentId); // Get student name

    if (course && course.offerCertificate) {
        const totalLessons = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);
        const completedLessons = updatedProgress.lessonProgress.filter(lp => lp.isCompleted).length;

        // If all lessons are completed and a certificate is offered
        if (totalLessons > 0 && completedLessons === totalLessons) {
            // Check if certificate already exists to prevent duplicates
            const existingCertificate = await Certificate.findOne({ student: studentId, course: courseId });
            
            if (!existingCertificate) {
                console.log(`Generating certificate for student ${student.name} for course ${course.title}`);

                // Fetch platform settings for logo/name on certificate
                const platformSettings = await Settings.findOne({ key: 'platformSettings' });
                const platformName = platformSettings?.platformName || 'EduFlex';
                const platformLogoUrl = platformSettings?.logo?.url || null;


                // Generate unique certificate ID
                const certificateId = `EDUFLEX-${Date.now()}-${studentId.toString().slice(-6)}-${courseId.toString().slice(-6)}`;

                // Data to pass to PDF template
                const certData = {
                    studentName: student.name,
                    courseTitle: course.title,
                    instructorName: course.createdBy ? course.createdBy.name : 'EduFlex Instructors',
                    completionDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    certificateId: certificateId,
                    platformName: platformName,
                    platformLogoUrl: platformLogoUrl
                };

                const { certificateUrl, public_id } = await generateCertificatePDF(certData); // Generate PDF

                // Save certificate record to DB
                await Certificate.create({
                    student: studentId,
                    course: courseId,
                    certificateId: certificateId,
                    certificateUrl: certificateUrl,
                    public_id: public_id,
                });

                // Optional: Notify student about certificate
                await Notification.create({
                    recipient: studentId,
                    recipientModel: 'Student',
                    message: `Congratulations! Your certificate for "${course.title}" is now available!`,
                    link: `/student/certificates`, // Link to a new certificates page
                    type: 'system' // Or a specific 'certificate' type
                });
                console.log(`Certificate generated and saved for ${student.name}`);
            } else {
                console.log(`Certificate already exists for student ${student.name} for course ${course.title}`);
            }
        }
    }

    res.status(200).json(updatedProgress);
});

// @desc    Get dashboard data for student
// @route   GET /api/students/dashboard
// @access  Private/Student
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

// @desc    Get student's progress overview for all enrolled courses
// @route   GET /api/students/my-progress-overview
// @access  Private/Student
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

// @desc    Get all assignments for the logged-in student
// @route   GET /api/students/my-assignments
// @access  Private/Student
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

// @desc    Register a new student
// @route   POST /api/auth/register (This route is typically handled by authController, but keeping for completeness if internal)
// @access  Public
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

// @desc    Get logged-in student profile
// @route   GET /api/students/profile
// @access  Private/Student
export const getStudentProfile = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.user._id).select('-password');
    if (student) {
        res.json(student);
    } else {
        res.status(404);
        throw new Error('Student not found');
    }
});

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private/Student
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

// @desc    Update student password
// @route   PUT /api/students/change-password
// @access  Private/Student
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

// @desc    Remove student avatar
// @route   DELETE /api/students/profile/avatar
// @access  Private/Student
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

// @desc    Get notifications for the logged-in student
// @route   GET /api/students/:id/notifications (This route is typically handled by notificationController)
// @access  Private/Student
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});

// --- NEW FUNCTIONS FOR CERTIFICATES ---

// @desc    Get all certificates for the logged-in student
// @route   GET /api/students/certificates
// @access  Private/Student
export const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ student: req.user._id })
    .populate('course', 'title createdBy') // Populate course title
    // .populate('createdBy', 'name') // This populate would be from the Certificate schema itself if createdBy was directly on it
    .sort({ completionDate: -1 });

  // Manually populate instructor name from the populated course object
  const populatedCertificates = await Promise.all(certificates.map(async cert => {
    if (cert.course && cert.course.createdBy) {
      const instructor = await cert.model('Company').findById(cert.course.createdBy).select('name');
      return {
        ...cert.toObject(),
        course: {
          ...cert.course.toObject(),
          instructorName: instructor ? instructor.name : 'Unknown Instructor'
        }
      };
    }
    return cert.toObject();
  }));

  res.status(200).json(populatedCertificates);
});

// @desc    Get a single certificate by ID for the logged-in student
// @route   GET /api/students/certificates/:id
// @access  Private/Student
export const getCertificateById = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id)
    .populate('student', 'name email') // Populate student details
    .populate('course', 'title createdBy'); // Populate course details

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  // Ensure the student owns this certificate
  if (certificate.student._id.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to view this certificate');
  }

  // Manually populate instructor name for single certificate
  let instructorName = 'Unknown Instructor';
  if (certificate.course && certificate.course.createdBy) {
    const instructor = await certificate.model('Company').findById(certificate.course.createdBy).select('name');
    if (instructor) {
      instructorName = instructor.name;
    }
  }

  res.status(200).json({
    ...certificate.toObject(),
    course: {
      ...certificate.course.toObject(),
      instructorName: instructorName
    }
  });
});