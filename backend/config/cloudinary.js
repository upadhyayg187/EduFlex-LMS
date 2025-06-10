// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Unified dynamic storage for thumbnail and video uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    if (file.fieldname === 'video') {
      return {
        folder: 'lms-videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi'],
      };
    } else if (file.fieldname === 'thumbnail') {
      return {
        folder: 'lms-thumbnails',
        allowed_formats: ['jpeg', 'png', 'jpg'],
      };
    }
  },
});

const upload = multer({ storage });

export { cloudinary, upload };
