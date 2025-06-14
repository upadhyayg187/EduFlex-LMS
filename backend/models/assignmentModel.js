import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['submitted', 'pending', 'graded'],
    default: 'pending',
  },
  submissionFile: String,
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

// ✅ THIS LINE IS IMPORTANT
export default Assignment;
