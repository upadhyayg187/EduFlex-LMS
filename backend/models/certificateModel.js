// LMS/backend/models/certificateModel.js

import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  // A unique ID for public verification
  certificateId: {
    type: String,
    required: true,
    unique: true,
  },
  // URL to the generated PDF certificate stored on Cloudinary
  certificateUrl: {
    type: String,
    required: true,
  },
  // Public ID if stored on Cloudinary, useful for deletion if needed
  public_id: {
    type: String,
    required: true,
  },
  completionDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Ensure a student gets only one certificate per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;