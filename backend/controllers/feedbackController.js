import Feedback from '../models/feedbackModel.js';
import Course from '../models/courseModel.js';

// @desc    Get all reviews for all courses created by a company
// @route   GET /api/feedback/company
// @access  Private/Company
export const getReviewsForCompany = async (req, res) => {
    try {
        // First, find all courses created by the logged-in company
        const courses = await Course.find({ createdBy: req.user._id }).select('_id');
        const courseIds = courses.map(course => course._id);

        // Then, find all feedback documents where the course ID is in our list of courses
        const reviews = await Feedback.find({ course: { $in: courseIds } })
            .populate('course', 'title') // Populate the course title
            .populate('student', 'name') // Populate the student's name
            .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        console.error("ERROR FETCHING REVIEWS:", error);
        res.status(500).json({ message: 'Server error while fetching reviews.' });
    }
};

// @desc    A student submits feedback for a course
// @route   POST /api/feedback
// @access  Private/Student
export const submitFeedback = async (req, res) => {
  try {
    const { course, rating, comment } = req.body;
    const studentId = req.user._id;

    // Optional: Add logic to ensure a student can only review a course they are enrolled in
    
    const feedback = new Feedback({
        course,
        rating,
        comment,
        student: studentId
    });
    
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};