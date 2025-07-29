// LMS/backend/controllers/certificateController.js

import asyncHandler from 'express-async-handler';
import Certificate from '../models/certificateModel.js'; // Import Certificate model
import Student from '../models/studentModel.js';     // Import Student model
import Course from '../models/courseModel.js';       // Import Course model

// @desc    Verify a certificate publicly by its certificateId
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
export const verifyCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;

  if (!certificateId) {
    res.status(400);
    throw new Error('Certificate ID is required for verification.');
  }

  const certificate = await Certificate.findOne({ certificateId })
    .populate('student', 'name email') // Populate student name and email
    .populate('course', 'title createdBy'); // Populate course title and creator

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found or invalid.');
  }

  // Manually populate instructor name from the populated course object
  let instructorName = 'Unknown Instructor';
  if (certificate.course && certificate.course.createdBy) {
    const instructor = await certificate.model('Company').findById(certificate.course.createdBy).select('name');
    if (instructor) {
      instructorName = instructor.name;
    }
  }

  // Return relevant certificate details for public verification
  res.status(200).json({
    message: 'Certificate successfully verified!',
    certificate: {
      studentName: certificate.student.name,
      courseTitle: certificate.course.title,
      instructorName: instructorName,
      completionDate: certificate.completionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      certificateUrl: certificate.certificateUrl, // Link to the PDF
      certificateId: certificate.certificateId,
      // You can add more details here if needed, but avoid sensitive info
    },
  });
});