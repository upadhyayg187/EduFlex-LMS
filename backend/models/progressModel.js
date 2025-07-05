import mongoose from 'mongoose';

const lessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  lastTimestamp: {
    type: Number,
    default: 0, // Time in seconds
  },
}, { _id: false });

const progressSchema = new mongoose.Schema({
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
  lessonProgress: [lessonProgressSchema],
}, { timestamps: true });

// Ensure a student can only have one progress document per course
progressSchema.index({ student: 1, course: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
