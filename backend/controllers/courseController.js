import Course from '../models/courseModel.js';
import { v2 as cloudinary } from 'cloudinary';

// GET all courses for the logged-in company
export const getCompanyCourses = async (req, res) => {
    try {
        const courses = await Course.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching courses.' });
    }
};

// GET a single published course by ID for public view
export const getPublicCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('createdBy', 'name');
        if (!course || course.status !== 'Published') {
            return res.status(404).json({ message: 'Course not found or is not available.' });
        }
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// GET a single course by ID for the owner (for editing)
export const getCourseByIdForOwner = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        if (course.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to view this course' });
        }
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// POST a new course (for both Drafts and Publishing)
export const createCourse = async (req, res) => {
    try {
        const { title, description, level, tags, price, offerCertificate, curriculum, status } = req.body;
        const companyId = req.user._id;

        if (status === 'Published' && (!req.files || !req.files.thumbnail || !req.files.thumbnail[0])) {
            return res.status(400).json({ message: 'A course thumbnail is required to publish.' });
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
    } catch (error) {
        console.error('ERROR CREATING COURSE:', error);
        res.status(500).json({ message: 'Server error during course creation.' });
    }
};

// PUT (Update) an existing course
export const updateCourse = async (req, res) => {
    try {
        const { title, description, level, tags, price, offerCertificate, curriculum, status } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: 'Course not found' });
        if (course.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to update this course.' });
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

    } catch (error) {
        console.error('ERROR UPDATING COURSE:', error);
        res.status(500).json({ message: 'Server error while updating course.' });
    }
};

// DELETE a course
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        if (course.createdBy.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'User not authorized.' });

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
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting course.' });
    }
};