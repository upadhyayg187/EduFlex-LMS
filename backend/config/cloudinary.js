import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder;
    let resource_type = 'auto';

    // Correctly checks for 'videos' (plural) from the frontend form
    if (file.fieldname === 'videos') {
      folder = 'lms-videos';
      resource_type = 'video';
    } else if (file.fieldname === 'thumbnail') {
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