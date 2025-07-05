import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import config from '../config/config.js';
import Course from '../models/courseModel.js';
import Student from '../models/studentModel.js';
import Feedback from '../models/feedbackModel.js';
import Progress from '../models/progressModel.js';
import { v2 as cloudinary } from 'cloudinary';

const instance = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
});

// --- THIS FUNCTION IS NOW UPDATED WITH TRANSACTION LOGIC ---
export const enrollInCourse = asyncHandler(async (req, res) => {
    const courseId = req.params.id;
    const studentId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found.');
    }
    
    if (course.students.map(id => id.toString()).includes(studentId.toString())) {
        res.status(400);
        throw new Error('You are already enrolled in this course.');
    }

    if (course.price === 0) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await Course.updateOne({ _id: courseId }, { $addToSet: { students: studentId } }, { session });
            await Student.updateOne({ _id: studentId }, { $addToSet: { enrolledCourses: courseId } }, { session });
            await session.commitTransaction();
            res.status(200).json({ success: true, message: 'Successfully enrolled in free course.' });
        } catch (error) {
            await session.abortTransaction();
            throw new Error('Free enrollment failed. Please try again.');
        } finally {
            session.endSession();
        }
        return;
    }
    
    const options = {
        amount: Number(course.price * 100),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
    };

    if (options.amount < 100) {
        throw new Error('Course price must be at least ₹1 to process payment.');
    }

    try {
        const order = await instance.orders.create(options);
        if (!order) {
            res.status(500);
            throw new Error('Could not create payment order.');
        }
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('[Enrollment] FAILED: Razorpay API Error:', error);
        throw new Error('Payment gateway error. Please try again later.');
    }
});


// ... The rest of your courseController.js file remains the same ...
// It does not need to be changed, so it is omitted here for brevity.
const courseWithRatingsPipeline = () => [
    { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'course', as: 'reviews' } },
    { $addFields: { averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] }, reviewCount: { $size: '$reviews' } } },
    { $lookup: { from: 'companies', localField: 'createdBy', foreignField: '_id', as: 'creatorInfo' } },
    { $unwind: { path: '$creatorInfo', preserveNullAndEmptyArrays: true } },
    { $project: {
        title: 1, description: 1, level: 1, tags: 1, price: 1, offerCertificate: 1, status: 1, thumbnail: 1,
        curriculum: 1, students: 1, createdAt: 1, averageRating: 1, reviewCount: 1,
        'createdBy.name': '$creatorInfo.name', 'createdBy._id': '$creatorInfo._id',
    }}
];
export const getEnrolledCourseForStudent = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id).populate('createdBy', 'name industry').lean();
    if (!course) { res.status(404); throw new Error('Course not found'); }
    const studentIdsAsStrings = course.students.map(id => id.toString());
    const isEnrolled = studentIdsAsStrings.includes(req.user._id.toString());
    if (!isEnrolled) { res.status(403); throw new Error('You are not authorized to view this course.'); }
    const progress = await Progress.findOne({ student: req.user._id, course: course._id }).lean();
    res.status(200).json({ ...course, progress: progress ? progress.lessonProgress : [] });
});
export const searchCourses = asyncHandler(async (req, res) => {
    const searchTerm = req.query.q || '';
    if (!searchTerm) { return getPublicCourses(req, res); }
    const pipeline = [
        { $match: { $text: { $search: searchTerm }, status: 'Published' } },
        { $addFields: { score: { $meta: "textScore" } } },
        ...courseWithRatingsPipeline(),
        { $sort: { score: { $meta: "textScore" } } }
    ];
    const finalProject = pipeline.find(stage => stage.$project);
    if (finalProject) finalProject.$project.score = 1;
    const courses = await Course.aggregate(pipeline);
    res.json(courses);
});
export const getPublicCourses = asyncHandler(async (req, res) => {
    const pipeline = [
        { $match: { status: 'Published' } },
        ...courseWithRatingsPipeline(),
        { $sort: { createdAt: -1 } }
    ];
    const courses = await Course.aggregate(pipeline);
    res.status(200).json(courses);
});
export const getPublicCourseById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) { res.status(404); throw new Error('Course not found.'); }
    const courseId = new mongoose.Types.ObjectId(req.params.id);
    const pipeline = [
        { $match: { _id: courseId, status: 'Published' } },
        ...courseWithRatingsPipeline()
    ];
    const courses = await Course.aggregate(pipeline);
    if (!courses || courses.length === 0) { res.status(404); throw new Error('Course not found or is not available.'); }
    res.status(200).json(courses[0]);
});
export const getCompanyCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(courses);
});
export const getCourseByIdForOwner = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) { res.status(404); throw new Error('Course not found'); }
    if (course.createdBy.toString() !== req.user._id.toString()) {
        res.status(401); throw new Error('Not authorized to view this course');
    }
    res.status(200).json(course);
});
export const createCourse = asyncHandler(async (req, res) => {
    const { title, description, level, tags, price, offerCertificate, curriculum, status } = req.body;
    const companyId = req.user._id;
    if (status === 'Published' && (!req.files || !req.files.thumbnail || !req.files.thumbnail[0])) {
        res.status(400); throw new Error('A course thumbnail is required to publish.');
    }
    let thumbnailData = {};
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
        thumbnailData = { url: req.files.thumbnail[0].path, public_id: req.files.thumbnail[0].filename };
    }
    let finalCurriculum = [];
    if (curriculum) {
        const parsedCurriculum = JSON.parse(curriculum);
        const videoFiles = req.files.videos || [];
        let videoIndex = 0;
        for (const section of parsedCurriculum) {
            if (!section.title || typeof section.title !== 'string' || section.title.trim() === '') {
                res.status(400); throw new Error('All curriculum sections must have a valid title.');
            }
        }
        finalCurriculum = parsedCurriculum.map(section => ({
            title: section.title,
            lessons: section.lessons.map(lesson => {
                const videoFile = lesson.hasVideo ? videoFiles[videoIndex++] : null;
                return { title: lesson.title, videoUrl: videoFile?.path || '', videoPublicId: videoFile?.filename || '' };
            })
        }));
    }
    const newCourse = new Course({
        title, description, level, status: status || 'Draft',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        price: Number(price) || 0,
        offerCertificate: offerCertificate === 'true',
        createdBy: companyId, thumbnail: thumbnailData, curriculum: finalCurriculum,
    });
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
});
export const updateCourse = asyncHandler(async (req, res) => {
    const { title, description, level, tags, price, offerCertificate, curriculum, status } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) { res.status(404); throw new Error('Course not found'); }
    if (course.createdBy.toString() !== req.user._id.toString()) {
        res.status(401); throw new Error('User not authorized to update this course.');
    }
    if (req.files && req.files.thumbnail) {
        if (course.thumbnail && course.thumbnail.public_id) {
            await cloudinary.uploader.destroy(course.thumbnail.public_id);
        }
        course.thumbnail = { url: req.files.thumbnail[0].path, public_id: req.files.thumbnail[0].filename };
    }
    if (curriculum) {
        const parsedCurriculum = JSON.parse(curriculum);
        const videoFiles = req.files.videos || [];
        let videoIndex = 0;
        course.curriculum = await Promise.all(parsedCurriculum.map(async (section) => {
            const newLessons = await Promise.all(section.lessons.map(async (lesson) => {
                let newLessonData = { title: lesson.title, _id: lesson._id };
                const originalSection = course.curriculum.find(s => s._id.toString() === section._id);
                const originalLesson = originalSection ? originalSection.lessons.find(l => l._id && l._id.toString() === lesson._id) : null;
                if (lesson.hasVideo && !lesson.videoUrl) {
                    const videoFile = videoFiles[videoIndex++];
                    if (videoFile) {
                       if (originalLesson && originalLesson.videoPublicId) {
                            await cloudinary.uploader.destroy(originalLesson.videoPublicId, { resource_type: 'video' });
                       }
                       newLessonData.videoUrl = videoFile.path;
                       newLessonData.videoPublicId = videoFile.filename;
                    }
                } else if (originalLesson) {
                    newLessonData.videoUrl = originalLesson.videoUrl;
                    newLessonData.videoPublicId = originalLesson.videoPublicId;
                }
                return newLessonData;
            }));
            const clientLessonIds = section.lessons.map(l => l._id).filter(Boolean);
            return {
                title: section.title,
                lessons: newLessons.filter(l => clientLessonIds.includes(l._id?.toString()) || !l._id),
                _id: section._id
            };
        }));
    }
    course.title = title ?? course.title;
    course.description = description ?? course.description;
    course.level = level ?? course.level;
    course.status = status ?? course.status;
    course.tags = tags ? tags.split(',').map(tag => tag.trim()) : course.tags;
    course.price = price !== undefined ? parseInt(price, 10) : course.price;
    course.offerCertificate = offerCertificate !== undefined ? offerCertificate === 'true' : course.offerCertificate;
    const updatedCourse = await course.save();
    res.status(200).json(updatedCourse);
});
export const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) { res.status(404); throw new Error('Course not found.'); }
    if (course.createdBy.toString() !== req.user._id.toString()) {
        res.status(401); throw new Error('User not authorized.');
    }
    if (course.thumbnail && course.thumbnail.public_id) {
        await cloudinary.uploader.destroy(course.thumbnail.public_id);
    }
    if (course.curriculum && course.curriculum.length > 0) {
        const videoPublicIds = course.curriculum.flatMap(s => s.lessons).map(l => l.videoPublicId).filter(Boolean);
        if (videoPublicIds.length > 0) {
            await cloudinary.api.delete_resources(videoPublicIds, { resource_type: 'video' });
        }
    }
    await course.deleteOne();
    res.status(200).json({ message: 'Course deleted successfully.' });
});
