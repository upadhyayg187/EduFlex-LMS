import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
  },
  description: { 
    type: String 
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  dueDate: { 
    type: Date 
  },
  createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Company',
  },
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;