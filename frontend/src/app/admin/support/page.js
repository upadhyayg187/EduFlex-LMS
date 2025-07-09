'use client';

import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { LifeBuoy, X, Send } from 'lucide-react';
import { format } from 'date-fns';

// --- Reusable Components ---

const TicketStatusBadge = ({ status }) => {
    const statusStyles = {
        open: 'bg-red-100 text-red-800 ring-red-600/20',
        pending: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
        resolved: 'bg-green-100 text-green-700 ring-green-600/20',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const ViewTicketDrawer = ({ isOpen, onClose, ticketData, onTicketUpdated }) => {
    const [reply, setReply] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticketData?.replies]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setIsReplying(true);
        try {
            const { data } = await axiosInstance.post(`/support/reply/${ticketData._id}`, { message: reply });
            onTicketUpdated(data);
            setReply('');
        } catch (error) {
            toast.error("Failed to send reply.");
        } finally {
            setIsReplying(false);
        }
    };
    
    const handleStatusChange = async (newStatus) => {
        const toastId = toast.loading('Updating status...');
        try {
            const { data } = await axiosInstance.put(`/support/status/${ticketData._id}`, { status: newStatus });
            onTicketUpdated(data);
            toast.success('Ticket status updated!', { id: toastId });
        } catch(error) {
            toast.error('Failed to update status.', { id: toastId });
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{ticketData?.subject}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <TicketStatusBadge status={ticketData?.status || 'open'}/>
                            <p className="text-sm text-gray-500">From: {ticketData?.company?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    {ticketData?.replies?.map((reply, index) => {
                         const isAdminReply = reply.senderModel === 'Admin';
                         return (
                            <div key={reply._id || index} className={`flex gap-4 ${isAdminReply ? 'justify-end' : 'justify-start'}`}>
                                {!isAdminReply && <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">{ticketData.company.name.charAt(0)}</div>}
                                <div className={`p-4 rounded-lg max-w-md ${isAdminReply ? 'bg-blue-50 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'}`}>
                                    <p className="font-semibold text-gray-800">{isAdminReply ? 'You (Support)' : ticketData.company.name}</p>
                                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{reply.message}</p>
                                    <p className="text-xs text-gray-400 mt-2 text-right">{new Date(reply.createdAt).toLocaleString()}</p>
                                </div>
                                {isAdminReply && <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white flex-shrink-0">A</div>}
                            </div>
                         )
                    })}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t bg-gray-50 flex-shrink-0 space-y-4">
                     <form onSubmit={handleReplySubmit} className="flex items-center gap-2">
                        <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                        <button type="submit" disabled={isReplying} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"><Send size={20}/></button>
                    </form>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-medium">Set Status:</span>
                        <button onClick={() => handleStatusChange('pending')} className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md hover:bg-yellow-200">Pending</button>
                        <button onClick={() => handleStatusChange('resolved')} className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200">Resolved</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};


// --- Main Page ---
export default function AdminSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isViewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const fetchAllTickets = async () => {
        try {
            const { data } = await axiosInstance.get('/support/admin/all-tickets');
            setTickets(data);
        } catch (error) {
            toast.error("Could not fetch support tickets.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllTickets();
    }, []);

    const handleTicketUpdated = (updatedTicket) => {
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
    };

    const viewTicket = async (ticketId) => {
        try {
             const { data } = await axiosInstance.get(`/support/${ticketId}`);
             setSelectedTicket(data);
             setViewDrawerOpen(true);
        } catch(error) {
            toast.error("Could not load ticket details.");
        }
    };

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <ViewTicketDrawer isOpen={isViewDrawerOpen} onClose={() => setViewDrawerOpen(false)} ticketData={selectedTicket} onTicketUpdated={handleTicketUpdated} />

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Support Center</h1>
                <p className="mt-1 text-lg text-gray-600">Review and manage all support tickets from companies.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-800">All Support Tickets</h2>
                <div className="mt-6 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead><tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Company</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Subject</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Updated</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">View</span></th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-10 text-gray-500">Loading tickets...</td></tr>
                                    ) : tickets.length > 0 ? tickets.map((ticket) => {
                                        // Defensive: handle missing company or company.name
                                        const companyName = ticket.company && ticket.company.name ? ticket.company.name : 'Unknown';
                                        return (
                                            <tr key={ticket._id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{companyName}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{ticket.subject}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm"><TicketStatusBadge status={ticket.status} /></td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{format(new Date(ticket.updatedAt), 'PPp')}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                    <button onClick={() => viewTicket(ticket._id)} className="text-blue-600 hover:text-blue-900">View<span className="sr-only">, {ticket.subject}</span></button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr><td colSpan="5" className="text-center py-10 text-gray-500">There are no support tickets.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
