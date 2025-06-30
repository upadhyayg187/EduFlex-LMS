import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel',
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Company', 'Admin'],
  },
  message: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const supportTicketSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Company',
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject for your ticket.'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Please provide a message for your ticket.'],
  },
  status: {
    type: String,
    enum: ['open', 'pending', 'resolved'],
    default: 'open',
  },
  replies: [replySchema],
}, { timestamps: true });

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;