import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  fileUrl: { // Link to student's uploaded work on Cloudinary
    type: String,
  },
  public_id: { // Cloudinary public ID for the file
    type: String,
  },
  submittedAt: {
      type: Date,
      default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Graded'],
    default: 'Submitted',
  },
  grade: {
    type: String,
  },
  feedback: { // Feedback from the company
    type: String,
  }
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;