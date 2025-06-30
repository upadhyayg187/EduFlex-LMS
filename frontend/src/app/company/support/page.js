'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { MessageSquare, Bot, X, Send, Plus } from 'lucide-react';
import useUser from '@/hooks/useUser';

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

const CreateTicketModal = ({ isOpen, onClose, onTicketCreated }) => {
    const formik = useFormik({
        initialValues: { subject: '', message: '' },
        validationSchema: Yup.object({
            subject: Yup.string().required('Subject is required.'),
            message: Yup.string().min(10, 'Message must be at least 10 characters.').required('Message is required.'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const toastId = toast.loading('Submitting ticket...');
            try {
                const { data } = await axiosInstance.post('/support', values);
                onTicketCreated(data);
                toast.success('Ticket submitted successfully!', { id: toastId });
                resetForm();
                onClose();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to submit ticket.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
    });

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg animate-in fade-in-0 zoom-in-95">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Support Ticket</h2>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject *</label>
                        <input type="text" id="subject" {...formik.getFieldProps('subject')} className="mt-1 block w-full p-2 bg-gray-50 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                        {formik.touched.subject && formik.errors.subject ? <p className="text-red-500 text-xs mt-1">{formik.errors.subject}</p> : null}
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Describe your issue *</label>
                        <textarea id="message" rows={5} {...formik.getFieldProps('message')} className="mt-1 block w-full p-2 bg-gray-50 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"/>
                        {formik.touched.message && formik.errors.message ? <p className="text-red-500 text-xs mt-1">{formik.errors.message}</p> : null}
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 rounded-lg shadow-sm">Cancel</button>
                        <button type="submit" disabled={formik.isSubmitting} className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700">{formik.isSubmitting ? 'Submitting...' : 'Submit Ticket'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewTicketDrawer = ({ isOpen, onClose, ticketData, onTicketUpdated }) => {
    const user = useUser();
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

    return (
        <div className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{ticketData?.subject}</h2>
                        <div className="flex items-center gap-2"><TicketStatusBadge status={ticketData?.status || 'open'}/></div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    {ticketData && (
                        <>
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">{user?.name.charAt(0)}</div>
                                <div className="bg-gray-100 p-4 rounded-lg rounded-tl-none">
                                    <p className="font-semibold text-gray-800">You</p>
                                    <p className="text-gray-700 mt-1">{ticketData.message}</p>
                                    <p className="text-xs text-gray-400 mt-2 text-right">{new Date(ticketData.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            {ticketData.replies.map(reply => (
                                <div key={reply._id} className={`flex gap-4 ${reply.senderModel === 'Company' ? 'justify-start' : 'justify-end'}`}>
                                    {reply.senderModel !== 'Company' && <div className="order-2 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">A</div>}
                                    {reply.senderModel === 'Company' && <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">{user?.name.charAt(0)}</div>}
                                    <div className={`p-4 rounded-lg ${reply.senderModel === 'Company' ? 'bg-gray-100 rounded-tl-none' : 'bg-blue-50 rounded-tr-none order-1'}`}>
                                        <p className="font-semibold text-gray-800">{reply.sender.name} {reply.senderModel === 'Company' ? '(You)' : '(Support)'}</p>
                                        <p className="text-gray-700 mt-1">{reply.message}</p>
                                        <p className="text-xs text-gray-400 mt-2 text-right">{new Date(reply.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t bg-gray-50 flex-shrink-0">
                    <form onSubmit={handleReplySubmit} className="flex items-center gap-2">
                        <input type="text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                        <button type="submit" disabled={isReplying} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"><Send size={20}/></button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

const AIChatbot = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([{ text: "Hi 👋 I'm your AI assistant! How can I help you with EduFlex today?", sender: 'ai' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        const userMessage = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const { data } = await axiosInstance.post('/ai-support', { message: currentInput });
            setMessages(prev => [...prev, { text: data.reply, sender: 'ai' }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Sorry, I couldn't understand your query. Please try rephrasing or create a support ticket for human assistance.", sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="fixed bottom-4 right-4 w-96 h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 animate-in fade-in-0 slide-in-from-bottom-4">
            <header className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <div className="flex items-center gap-2"><Bot className="text-blue-600"/><h3 className="font-bold text-gray-800">AI Assistant</h3></div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </header>
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>{msg.text}</div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-500">Thinking...</div></div>}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t bg-white rounded-b-2xl">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." className="flex-grow p-2 border border-gray-300 rounded-lg"/>
                    <button type="submit" disabled={isLoading} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"><Send size={20}/></button>
                </form>
            </footer>
        </div>
    );
};

// --- Main Page ---
export default function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isViewDrawerOpen, setViewDrawerOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isChatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const { data } = await axiosInstance.get('/support/my-tickets');
                setTickets(data);
            } catch (error) {
                toast.error("Could not fetch support tickets.");
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const handleTicketCreated = (newTicket) => setTickets([newTicket, ...tickets]);
    const handleTicketUpdated = (updatedTicket) => {
        setTickets(tickets.map(t => t._id === updatedTicket._id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
    };

    const viewTicket = (ticketId) => {
        const ticketToView = tickets.find(t => t._id === ticketId);
        setSelectedTicket(ticketToView);
        setViewDrawerOpen(true);
    };

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <CreateTicketModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onTicketCreated={handleTicketCreated} />
            <ViewTicketDrawer isOpen={isViewDrawerOpen} onClose={() => setViewDrawerOpen(false)} ticketData={selectedTicket} onTicketUpdated={handleTicketUpdated} />
            <AIChatbot isOpen={isChatOpen} onClose={() => setChatOpen(false)} />

            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Support Center</h1>
                <p className="mt-1 text-lg text-gray-600">Get help, find answers, and manage your support tickets.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-gray-800">My Support Tickets</h2>
                        <button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700">
                            <Plus size={18} /> Create Ticket
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead><tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Subject</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Updated</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0"><span className="sr-only">View</span></th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {loading ? (
                                            <tr><td colSpan="4" className="text-center py-10 text-gray-500">Loading tickets...</td></tr>
                                        ) : tickets.length > 0 ? tickets.map((ticket) => (
                                            <tr key={ticket._id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{ticket.subject}</td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm"><TicketStatusBadge status={ticket.status} /></td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                                    <button onClick={() => viewTicket(ticket._id)} className="text-blue-600 hover:text-blue-900">View<span className="sr-only">, {ticket.subject}</span></button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="4" className="text-center py-10 text-gray-500">You have no support tickets.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                     <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                        <div className="flex items-center gap-3"><MessageSquare className="h-8 w-8 text-blue-600" /><h2 className="text-2xl font-semibold text-gray-800">Need Instant Help?</h2></div>
                        <p className="text-sm text-gray-500 mt-2">Try our AI Assistant for instant answers to common questions.</p>
                        <button onClick={() => setChatOpen(true)} className="mt-4 w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-black transition shadow-sm flex items-center justify-center gap-2">
                            <Bot size={20} /> Ask AI Assistant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
