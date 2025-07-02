import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import config from './config.js'; // Import our new config

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder;
    let resource_type = 'auto';

    if (file.fieldname === 'videos') {
      folder = 'lms-videos';
      resource_type = 'video';
    } else if (file.fieldname === 'thumbnail' || file.fieldname === 'avatar') {
      folder = 'lms-thumbnails';
      resource_type = 'image';
    } else {
      folder = 'lms-others';
    }
    
    return {
      folder: folder,
      resource_type: resource_type,
      public_id: file.originalname.split('.')[0] + '_' + Date.now(),
    };
  },
});

const upload = multer({ storage: storage });

export { upload };
