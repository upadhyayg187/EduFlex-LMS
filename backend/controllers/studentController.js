import asyncHandler from 'express-async-handler';
import Student from '../models/studentModel.js';
import Course from '../models/courseModel.js';
import Assignment from '../models/assignmentModel.js';
import Submission from '../models/submissionModel.js'; // Import Submission model
import Notification from '../models/notificationModel.js';
import generateToken from '../utils/generateToken.js';

// --- NEW FUNCTION for the Student Dashboard ---
// @desc    Get data for the student dashboard
// @route   GET /api/students/dashboard
// @access  Private/Student
export const getDashboardData = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    // 1. Get enrolled courses
    const enrolledCourses = await Course.find({ students: studentId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title thumbnail level');

    // 2. Get total number of enrolled courses
    const enrolledCoursesCount = await Course.countDocuments({ students: studentId });

    // 3. Get assignments for enrolled courses
    const courseIds = enrolledCourses.map(c => c._id);
    const assignments = await Assignment.find({ course: { $in: courseIds } });
    const assignmentIds = assignments.map(a => a._id);

    // 4. Get submissions to check completion status
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


// @desc    Register a new student
// @route   POST /api/students/signup
// @access  Public
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const studentExists = await Student.findOne({ email });
  if (studentExists) {
    return res.status(400).json({ message: 'Student already exists' });
  }

  const student = await Student.create({ name, email, password });

  if (student) {
    generateToken(res, student._id, 'student');
    res.status(201).json({
      _id: student._id,
      name: student.name,
      email: student.email,
      role: 'student',
    });
  } else {
    res.status(400).json({ message: 'Invalid student data' });
  }
});

// @desc    Get enrolled courses
// @route   GET /api/students/:id/courses
// @access  Private
const getStudentCourses = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized for this student' });
  }

  const courses = await Course.find({ students: studentId }).populate('createdBy', 'name');
  res.json(courses);
});

// @desc    Get course progress (dummy structure)
// @route   GET /api/students/:id/progress
// @access  Private
const getStudentProgress = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized for this student' });
  }

  const dummyProgress = [
    { courseId: '123', progress: 70 },
    { courseId: '456', progress: 45 },
  ];

  res.json(dummyProgress);
});

// @desc    Submit an assignment
// @route   POST /api/students/:id/assignments
// @access  Private
const submitAssignment = asyncHandler(async (req, res) => {
  const studentId = req.params.id;
  const { courseId, content, fileUrl } = req.body;

  if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized for this student' });
  }

  const course = await Course.findById(courseId);
  if (!course || !course.students.includes(studentId)) {
    return res.status(400).json({ message: 'Student is not enrolled in this course' });
  }

  const assignment = await Assignment.create({
    student: studentId,
    course: courseId,
    content,
    fileUrl,
  });

  res.status(201).json({ message: 'Assignment submitted successfully', assignment });
});

// @desc    Get student notifications
// @route   GET /api/students/:id/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  if (req.user._id.toString() !== studentId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized for this student' });
  }

  const notifications = await Notification.find({ recipient: studentId }).sort({ createdAt: -1 });
  res.json(notifications);
});

// @desc    Update student profile
// @route   PUT /api/students/:id/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  if (req.user._id.toString() !== student._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized for this student' });
  }

  student.name = req.body.name || student.name;
  student.email = req.body.email || student.email;

  if (req.body.password) {
    student.password = req.body.password;
  }

  const updatedStudent = await student.save();
  res.json({
    _id: updatedStudent._id,
    name: updatedStudent.name,
    email: updatedStudent.email,
  });
});

export {
  registerStudent,
  getStudentCourses,
  getStudentProgress,
  submitAssignment,
  getNotifications,
  updateProfile,
};
