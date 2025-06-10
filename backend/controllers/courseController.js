import Course from '../models/courseModel.js';

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Company
export const createCourse = async (req, res) => {
  try {
    const { title, description, videoTitle } = req.body;
    const companyId = req.user._id;

    // Check if files were uploaded
    if (!req.files || !req.files.thumbnail || !req.files.video) {
      return res.status(400).json({ message: 'Please upload a thumbnail and a video.' });
    }

    const thumbnailFile = req.files.thumbnail[0];
    const videoFile = req.files.video[0];

    const course = new Course({
      title,
      description,
      createdBy: companyId,
      thumbnail: {
        url: thumbnailFile.path,
        public_id: thumbnailFile.filename,
      },
      videos: [
        {
          title: videoTitle,
          url: videoFile.path,
          public_id: videoFile.filename,
        },
      ],
    });

    const createdCourse = await course.save();
    res.status(201).json(createdCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
    console.log(error);
  }
};
