import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in your .env file.');
    process.exit(1);
}

const config = {
    port: process.env.PORT || 5000,
    mongoURI: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    geminiApiKey: process.env.GEMINI_API_KEY,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID, // --- ADD THIS ---
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET, // --- ADD THIS ---
};

export default config;
