import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    refPath: 'recipientModel' 
  },
  recipientModel: { 
    type: String, 
    required: true, 
    enum: ['Student', 'Company', 'Admin'] 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    enum: ['new_student', 'new_review', 'assignment_submission', 'course_published', 'system'],
    default: 'system',
  },
  link: { // A URL to navigate to when the notification is clicked
    type: String,
  },
  read: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;