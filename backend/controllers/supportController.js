import SupportTicket from '../models/supportTicketModel.js';
import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';
import Admin from '../models/adminModel.js';

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
        // The first message is the first reply from the company
        replies: [{ message, sender: req.user._id, senderModel: 'Company' }]
    });
    const createdTicket = await ticket.save();

    // Notify all admins about the new ticket
    const admins = await Admin.find({}).select('_id');
    if (admins.length > 0) {
        const notifications = admins.map(admin => ({
            recipient: admin._id,
            recipientModel: 'Admin',
            message: `New support ticket from '${req.user.name}': "${subject}"`,
            link: `/admin/support`,
            type: 'system'
        }));
        await Notification.create(notifications);
    }

    res.status(201).json(createdTicket);
});

// @desc    Company gets their own support tickets
// @route   GET /api/support/my-tickets
export const getCompanyTickets = asyncHandler(async (req, res) => {
    const tickets = await SupportTicket.find({ company: req.user._id }).sort({ updatedAt: -1 });
    res.json(tickets);
});

// @desc    Admin gets all support tickets from all companies
// @route   GET /api/support/admin/all-tickets
export const getAllTicketsForAdmin = asyncHandler(async (req, res) => {
    const tickets = await SupportTicket.find({})
        .populate('company', 'name')
        .sort({ updatedAt: -1 });
    res.json(tickets);
});


// @desc    Get a single ticket by ID (for company or admin)
// @route   GET /api/support/:id
export const getTicketById = asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id)
        .populate('company', 'name email')
        .populate('replies.sender', 'name');
        
    if (ticket) {
        // Allow access if the user is the ticket owner or an admin
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
        const isCompanyOwner = ticket.company.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isCompanyOwner && !isAdmin) {
            res.status(403);
            throw new Error('Not authorized to reply to this ticket');
        }

        const reply = {
            message,
            sender: req.user._id,
            senderModel: isAdmin ? 'Admin' : 'Company',
        };

        ticket.replies.push(reply);
        ticket.status = isAdmin ? 'pending' : 'open';
        
        const updatedTicket = await ticket.save();

        // Create a notification for the other party
        if (isAdmin) {
            // Admin replied, so notify the company
            await Notification.create({
                recipient: ticket.company,
                recipientModel: 'Company',
                message: `Admin replied to your support ticket: "${ticket.subject}"`,
                link: '/company/support',
                type: 'system'
            });
        }

        const finalTicket = await SupportTicket.findById(updatedTicket._id)
            .populate('company', 'name email')
            .populate('replies.sender', 'name');

        res.status(201).json(finalTicket);
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

        // Notify the company of the status change
         await Notification.create({
            recipient: ticket.company,
            recipientModel: 'Company',
            message: `Your support ticket "${ticket.subject}" has been marked as ${status}.`,
            link: '/company/support',
            type: 'system'
        });

        // Refetch the fully populated ticket to send back
        const finalTicket = await SupportTicket.findById(updatedTicket._id)
            .populate('company', 'name email')
            .populate('replies.sender', 'name');

        res.json(finalTicket);
    } else {
        res.status(404);
        throw new Error('Ticket not found');
    }
});