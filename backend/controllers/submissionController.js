import asyncHandler from 'express-async-handler';
import Submission from '../models/submissionModel.js';
import Assignment from '../models/assignmentModel.js';

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

    // Check if a submission for this assignment by this student already exists
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
