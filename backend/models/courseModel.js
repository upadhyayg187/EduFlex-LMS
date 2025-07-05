import mongoose from 'mongoose';

const lessonSchema = mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, default: '' },
  videoPublicId: { type: String, default: '' },
});

const sectionSchema = mongoose.Schema({
  title: { type: String, required: true },
  lessons: [lessonSchema],
});

const courseSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    level: { type: String, required: true },
    tags: { type: [String] },
    price: { type: Number, required: true, default: 0 },
    offerCertificate: { type: Boolean, default: false },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' }, 
    thumbnail: {
      url: { type: String, default: '' },
      public_id: { type: String, default: '' },
    },
    curriculum: [sectionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Company',
    },
    // --- THIS IS THE FIX ---
    // Added the missing field to track enrolled students
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }]
}, { timestamps: true });

// Add a text index for searching
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Course = mongoose.model('Course', courseSchema);

export default Course;
