import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
