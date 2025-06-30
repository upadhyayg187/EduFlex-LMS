import SupportTicket from '../models/supportTicketModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Company creates a new support ticket
// @route   POST /api/support
export const createTicket = asyncHandler(async (req, res) => {
    const { subject, message } = req.body;
    if (!subject || !message) {
        res.status(400);
        throw new Error('Subject and message are required.');
    }
    const ticket = new SupportTicket({
        company: req.user._id,
        subject,
        message,
    });
    const createdTicket = await ticket.save();
    res.status(201).json(createdTicket);
});

// @desc    Company gets their own support tickets
// @route   GET /api/support/my-tickets
export const getCompanyTickets = asyncHandler(async (req, res) => {
    const tickets = await SupportTicket.find({ company: req.user._id }).sort({ updatedAt: -1 });
    res.json(tickets);
});

// @desc    Get a single ticket by ID (for company or admin)
// @route   GET /api/support/:id
export const getTicketById = asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id)
        .populate('company', 'name email')
        .populate('replies.sender', 'name');
        
    if (ticket) {
        if (ticket.company._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
            res.json(ticket);
        } else {
            res.status(403);
            throw new Error('Not authorized to view this ticket');
        }
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
});

// @desc    Add a reply to a ticket (by company or admin)
// @route   POST /api/support/reply/:ticketId
export const addReply = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (ticket) {
        if (ticket.company.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to reply to this ticket');
        }

        const reply = {
            message,
            sender: req.user._id,
            senderModel: req.user.role === 'admin' ? 'Admin' : 'Company',
        };

        ticket.replies.push(reply);
        ticket.status = req.user.role === 'admin' ? 'pending' : 'open';
        
        await ticket.save();
        const updatedTicket = await SupportTicket.findById(ticket._id)
            .populate('company', 'name email')
            .populate('replies.sender', 'name');

        res.status(201).json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
});

// @desc    Admin updates ticket status
// @route   PUT /api/support/status/:ticketId
export const updateTicketStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const ticket = await SupportTicket.findById(req.params.ticketId);

    if (ticket) {
        ticket.status = status;
        const updatedTicket = await ticket.save();
        res.json(updatedTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
});