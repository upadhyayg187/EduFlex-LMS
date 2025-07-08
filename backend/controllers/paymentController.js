import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js';
import Course from '../models/courseModel.js';
import Student from '../models/studentModel.js';
import Payment from '../models/paymentModel.js';
import Notification from '../models/notificationModel.js';
import Admin from '../models/adminModel.js'; // Import Admin model
import mongoose from 'mongoose';

const instance = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
});

export const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId } = req.body;
    const studentId = req.user._id;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac('sha256', config.razorpayKeySecret)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const course = await Course.findById(courseId).session(session);
            const student = await Student.findById(studentId).session(session);
            
            if (!course || !student) throw new Error('Course or Student not found');

            await Course.updateOne({ _id: courseId }, { $addToSet: { students: studentId } }, { session });
            await Student.updateOne({ _id: studentId }, { $addToSet: { enrolledCourses: courseId } }, { session });
            
            await Payment.create([{
                razorpay_order_id, razorpay_payment_id, razorpay_signature,
                student: studentId, course: courseId, amount: course.price,
            }], { session });

            // --- FIX: Create notifications for both company and admin ---
            const admins = await Admin.find({}).select('_id').session(session);
            const notifications = [];
            
            // Notification for the Company
            notifications.push({
                recipient: course.createdBy,
                recipientModel: 'Company',
                message: `New student '${student.name}' has enrolled in your course: "${course.title}"`,
                link: `/company/students/${student._id}`,
                type: 'new_student'
            });

            // Notifications for all Admins
            if (admins.length > 0) {
                admins.forEach(admin => {
                    notifications.push({
                        recipient: admin._id,
                        recipientModel: 'Admin',
                        message: `New student '${student.name}' has enrolled in course "${course.title}"`,
                        link: `/admin/students`,
                        type: 'new_student'
                    });
                });
            }

            await Notification.create(notifications, { session });

            await session.commitTransaction();
            res.status(200).json({ success: true, message: "Enrollment successful!" });

        } catch (error) {
            await session.abortTransaction();
            console.error("Enrollment Transaction Error:", error);
            throw new Error('Enrollment process failed. Please try again.');
        } finally {
            session.endSession();
        }

    } else {
        res.status(400);
        throw new Error('Payment verification failed.');
    }
});