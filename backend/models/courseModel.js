import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true, // Cloudinary file ID
  },
}, { _id: false }); // Optional: omit _id for subdocs

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
  },
  thumbnail: {
    url: {
      type: String,
      required: [true, 'Thumbnail URL is required'],
    },
    public_id: {
      type: String,
      required: [true, 'Thumbnail public_id is required'],
    },
  },
  videos: {
    type: [videoSchema],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Course must be associated with a company'],
  },
  students: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Student',
    default: [],
  },
}, {
  timestamps: true,
});

// Optional: Add text index for search functionality
courseSchema.index({ title: 'text', description: 'text' });

const Course = mongoose.model('Course', courseSchema);
export default Course;
