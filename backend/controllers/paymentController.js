import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js';
import Course from '../models/courseModel.js';
import Student from '../models/studentModel.js';
import Payment from '../models/paymentModel.js';
import mongoose from 'mongoose'; // Import Mongoose

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
        // --- FIX: Use a transaction for data consistency ---
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const course = await Course.findById(courseId).session(session);
            if (!course) throw new Error('Course not found');

            await Course.updateOne(
                { _id: courseId },
                { $addToSet: { students: studentId } },
                { session }
            );
            await Student.updateOne(
                { _id: studentId },
                { $addToSet: { enrolledCourses: courseId } },
                { session }
            );
            
            await Payment.create([{
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                student: studentId,
                course: courseId,
                amount: course.price,
            }], { session });

            await session.commitTransaction();
            res.status(200).json({ success: true, message: "Enrollment successful!" });

        } catch (error) {
            await session.abortTransaction();
            throw new Error('Enrollment process failed. Please try again.');
        } finally {
            session.endSession();
        }

    } else {
        res.status(400);
        throw new Error('Payment verification failed.');
    }
});
