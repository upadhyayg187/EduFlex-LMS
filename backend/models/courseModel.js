import mongoose from 'mongoose';

const lessonSchema = mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  videoPublicId: { type: String, required: true },
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
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published' },
    thumbnail: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    curriculum: [sectionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Company',
    },
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;
