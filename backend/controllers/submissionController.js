import asyncHandler from 'express-async-handler';
import Submission from '../models/submissionModel.js';
import Assignment from '../models/assignmentModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Create a new submission for an assignment
// @route   POST /api/submissions
// @access  Private/Student
export const createSubmission = asyncHandler(async (req, res) => {
    const { assignmentId } = req.body;
    const studentId = req.user._id;

    if (!assignmentId) {
        res.status(400);
        throw new Error('Assignment ID is required.');
    }
    if (!req.file) {
        res.status(400);
        throw new Error('A file is required for submission.');
    }

    const existingSubmission = await Submission.findOne({ assignment: assignmentId, student: studentId });
    if (existingSubmission) {
        res.status(400);
        throw new Error('You have already submitted this assignment.');
    }

    const submission = await Submission.create({
        assignment: assignmentId,
        student: studentId,
        fileUrl: req.file.path,
        public_id: req.file.filename,
        status: 'Submitted',
    });

    res.status(201).json(submission);
});

// --- NEW FUNCTION ---
// @desc    Grade a student's submission
// @route   PUT /api/submissions/:id/grade
// @access  Private/Company
export const gradeSubmission = asyncHandler(async (req, res) => {
    const { grade, feedback } = req.body;
    const submission = await Submission.findById(req.params.id).populate('assignment');

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found.');
    }

    // Authorization check: Ensure the user grading is the one who created the assignment
    if (submission.assignment.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not authorized to grade this submission.');
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'Graded';

    const updatedSubmission = await submission.save();

    // Notify the student
    await Notification.create({
        recipient: submission.student,
        recipientModel: 'Student',
        message: `Your submission for "${submission.assignment.title}" has been graded.`,
        link: `/student/assignments`, // Or a more specific link
    });

    res.json(updatedSubmission);
});
