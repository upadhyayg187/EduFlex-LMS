import asyncHandler from 'express-async-handler';
import Course from '../models/courseModel.js';
import Feedback from '../models/feedbackModel.js'; // Make sure Feedback model is imported
import { v2 as cloudinary } from 'cloudinary';

// @desc    Get all published courses for public view / search
// @route   GET /api/courses/public
export const getPublicCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({ status: 'Published' }).populate('createdBy', 'name').sort({ createdAt: -1 }).lean();

    // For each course, calculate its average rating
    const coursesWithRatings = await Promise.all(
        courses.map(async (course) => {
            const reviews = await Feedback.find({ course: course._id });
            let averageRating = 0;
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
                averageRating = totalRating / reviews.length;
            }
            return {
                ...course,
                averageRating,
                reviewCount: reviews.length,
            };
        })
    );

    res.status(200).json(coursesWithRatings);
});

// @desc    Get a single published course by ID for public view
export const getPublicCourseById = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id).populate('createdBy', 'name').lean();
    if (!course || course.status !== 'Published') {
        res.status(404);
        throw new Error('Course not found or is not available.');
    }
    
    // Also add rating to this single view
    const reviews = await Feedback.find({ course: course._id });
    let averageRating = 0;
    if (reviews.length > 0) {
        const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
        averageRating = totalRating / reviews.length;
    }
    
    res.status(200).json({ ...course, averageRating, reviewCount: reviews.length });
});

// --- Other functions remain the same ---

// @desc    Get all courses for the logged-in company
export const getCompanyCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(courses);
});

// @desc    Get a single course by ID for the owner (for editing)
export const getCourseByIdForOwner = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }
    if (course.createdBy.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to view this course');
    }
    res.status(200).json(course);
});

// @desc    Create a new course (for both Drafts and Publishing)
export const createCourse = asyncHandler(async (req, res) => {
    const { title, description, level, tags, price, offerCertificate, curriculum, status } = req.body;
    const companyId = req.user._id;

    if (status === 'Published' && (!req.files || !req.files.thumbnail || !req.files.thumbnail[0])) {
        res.status(400);
        throw new Error('A course thumbnail is required to publish.');
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
                res.status(400);
                throw new Error('All curriculum sections must have a valid title.');
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

// @desc    Update an existing course
export const updateCourse = asyncHandler(async (req, res) => {
    const { title, description, level, tags, price, offerCertificate, curriculum, status } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }
    if (course.createdBy.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized to update this course.');
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

        const newCurriculum = await Promise.all(parsedCurriculum.map(async (section) => {
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
            const clientLessonIds = section.lessons.map(l => l._id);
            const finalLessons = newLessons.filter(l => clientLessonIds.includes(l._id));
            return { title: section.title, lessons: finalLessons, _id: section._id };
        }));
        course.curriculum = newCurriculum;
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

// @desc    Delete a course
export const deleteCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        res.status(404);
        throw new Error('Course not found.');
    }
    if (course.createdBy.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized.');
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
