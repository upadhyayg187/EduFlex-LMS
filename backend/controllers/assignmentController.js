import Assignment from '../models/assignmentModel.js';
import Submission from '../models/submissionModel.js';
import Course from '../models/courseModel.js';

// @desc    Create a new assignment for a course
export const createAssignment = async (req, res) => {
    try {
        const { title, description, courseId, dueDate } = req.body;
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (course.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to create an assignment for this course.' });
        }
        const assignment = await Assignment.create({
            title, description, course: courseId, dueDate, createdBy: req.user._id,
        });
        const newAssignment = await Assignment.findById(assignment._id).populate('course', 'title');
        res.status(201).json({ ...newAssignment.toObject(), submissionCount: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating assignment.' });
    }
};

// @desc    Get all assignments created by a company
export const getAssignmentsForCompany = async (req, res) => {
    try {
        const assignments = await Assignment.find({ createdBy: req.user._id })
            .populate('course', 'title')
            .sort({ createdAt: -1 });
        const assignmentsWithSubmissionCounts = await Promise.all(
            assignments.map(async (assignment) => {
                const submissionCount = await Submission.countDocuments({ assignment: assignment._id });
                return { ...assignment.toObject(), submissionCount };
            })
        );
        res.status(200).json(assignmentsWithSubmissionCounts);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching assignments.' });
    }
};

// --- NEW FUNCTION ---
// @desc    Get a single assignment by its ID
// @route   GET /api/assignments/:id
export const getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (assignment.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to view this assignment' });
        }
        res.status(200).json(assignment);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION ---
// @desc    Update an assignment
// @route   PUT /api/assignments/:id
export const updateAssignment = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found.'});
        }
        if (assignment.createdBy.toString() !== req.user._id.toString()) {
             return res.status(401).json({ message: 'User not authorized.' });
        }

        assignment.title = title || assignment.title;
        assignment.description = description || assignment.description;
        assignment.dueDate = dueDate || assignment.dueDate;

        const updatedAssignment = await assignment.save();
        
        // Repopulate course and get submission count to return the same object structure
        const finalAssignment = await Assignment.findById(updatedAssignment._id).populate('course', 'title');
        const submissionCount = await Submission.countDocuments({ assignment: finalAssignment._id });

        res.status(200).json({
            ...finalAssignment.toObject(),
            submissionCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating assignment.' });
    }
};


// @desc    Get all submissions for a specific assignment
export const getSubmissionsForAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found.'});
        if (assignment.createdBy.toString() !== req.user._id.toString()) {
             return res.status(401).json({ message: 'User not authorized.' });
        }
        const submissions = await Submission.find({ assignment: req.params.id }).populate('student', 'name email');
        res.status(200).json({ assignment, submissions });
    } catch (error) {
         res.status(500).json({ message: 'Server error while fetching submissions.' });
    }
};

// @desc    Delete an assignment
export const deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found.'});
        if (assignment.createdBy.toString() !== req.user._id.toString()) {
             return res.status(401).json({ message: 'User not authorized.' });
        }
        
        await Submission.deleteMany({ assignment: assignment._id });
        await assignment.deleteOne();
        res.status(200).json({ message: 'Assignment and all its submissions deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting assignment.' });
    }
};