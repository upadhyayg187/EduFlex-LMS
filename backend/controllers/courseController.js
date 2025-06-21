import Course from '../models/courseModel.js';
import { v2 as cloudinary } from 'cloudinary';

// @desc    Get all courses created by a specific company
// @route   GET /api/courses
// @access  Private/Company
export const getCompanyCourses = async (req, res) => {
    try {
        // req.user is attached by the `protect` middleware
        const courses = await Course.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(courses);
    } catch (error) {
        console.error('ERROR FETCHING COURSES:', error);
        res.status(500).json({ message: 'Server error while fetching courses.' });
    }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Company
export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Ensure the user deleting the course is the one who created it
        if (course.createdBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'User not authorized to delete this course.' });
        }

        // Delete media from Cloudinary
        // 1. Delete thumbnail
        if (course.thumbnail && course.thumbnail.public_id) {
            await cloudinary.uploader.destroy(course.thumbnail.public_id);
        }
        // 2. Delete all lesson videos
        if (course.curriculum && course.curriculum.length > 0) {
            const videoPublicIds = course.curriculum
                .flatMap(section => section.lessons)
                .map(lesson => lesson.videoPublicId)
                .filter(id => id); // Filter out any undefined IDs

            if (videoPublicIds.length > 0) {
                // Cloudinary's delete_resources can take an array of public_ids
                await cloudinary.api.delete_resources(videoPublicIds, { resource_type: 'video' });
            }
        }

        // Delete the course from the database
        await course.deleteOne();

        res.status(200).json({ message: 'Course deleted successfully.' });

    } catch (error) {
        console.error('ERROR DELETING COURSE:', error);
        res.status(500).json({ message: 'Server error while deleting course.' });
    }
};


// Keep your existing createCourse function below
export const createCourse = async (req, res) => {
    try {
        const { title, description, level, tags, price, offerCertificate, curriculum } = req.body;
        const companyId = req.user._id;

        if (!req.files || !req.files.thumbnail || !req.files.thumbnail[0]) {
            return res.status(400).json({ message: 'A course thumbnail is required.' });
        }
        if (!req.files.videos || req.files.videos.length === 0) {
            return res.status(400).json({ message: 'At least one course video is required.' });
        }
        
        const thumbnailFile = req.files.thumbnail[0];
        const videoFiles = req.files.videos;
        
        if (!curriculum) {
             return res.status(400).json({ message: 'Curriculum data is missing.' });
        }
        const parsedCurriculum = JSON.parse(curriculum);

        let videoIndex = 0;
        const finalCurriculum = parsedCurriculum.map(section => ({
            title: section.title,
            lessons: section.lessons.map(lesson => {
                if (videoIndex < videoFiles.length) {
                    const videoFile = videoFiles[videoIndex++];
                    return {
                        title: lesson.title,
                        videoUrl: videoFile.path,
                        videoPublicId: videoFile.filename,
                    };
                }
                return null;
            }).filter(Boolean)
        }));

        const newCourse = new Course({
            title, description, level,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            price: Number(price),
            offerCertificate: offerCertificate === 'true',
            createdBy: companyId,
            thumbnail: {
                url: thumbnailFile.path,
                public_id: thumbnailFile.filename,
            },
            curriculum: finalCurriculum,
        });

        const savedCourse = await newCourse.save();
        res.status(201).json(savedCourse);

    } catch (error) {
        console.error('ERROR CREATING COURSE:', error);
        res.status(500).json({ message: 'Server error during course creation. Check server logs for details.' });
    }
};