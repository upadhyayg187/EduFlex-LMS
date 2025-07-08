import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    // Using a singleton pattern with a fixed name to ensure only one settings document exists
    key: {
        type: String,
        default: 'platformSettings',
        unique: true
    },
    platformName: {
        type: String,
        default: 'EduFlex'
    },
    logo: {
        url: { type: String, default: '' },
        public_id: { type: String, default: '' },
    },
    // Add other platform-wide settings here in the future
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
