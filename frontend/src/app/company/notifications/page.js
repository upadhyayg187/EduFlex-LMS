'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Bell, UserPlus, Star, FileText, CheckCheck, Mail } from 'lucide-react';
import Link from 'next/link';

// Helper to format dates into groups like "Today", "Yesterday", etc.
const groupNotificationsByDate = (notifications) => {
    const groups = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        'Older': [],
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    notifications.forEach(notif => {
        const notifDate = new Date(notif.createdAt);
        if (notifDate.toDateString() === today.toDateString()) {
            groups.Today.push(notif);
        } else if (notifDate.toDateString() === yesterday.toDateString()) {
            groups.Yesterday.push(notif);
        } else if (notifDate > oneWeekAgo) {
            groups['This Week'].push(notif);
        } else {
            groups.Older.push(notif);
        }
    });

    return groups;
};

// Map notification types to icons and colors
const notificationIcons = {
    new_student: { icon: UserPlus, color: 'bg-blue-500' },
    new_review: { icon: Star, color: 'bg-yellow-500' },
    assignment_submission: { icon: FileText, color: 'bg-green-500' },
    system: { icon: Bell, color: 'bg-gray-500' },
    default: { icon: Bell, color: 'bg-gray-500' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await axiosInstance.get('/notifications');
                setNotifications(data);
            } catch (error) {
                toast.error('Could not fetch notifications.');
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAllAsRead = async () => {
        const toastId = toast.loading('Marking all as read...');
        try {
            await axiosInstance.patch('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            toast.success('All notifications marked as read.', { id: toastId });
        } catch (error) {
            toast.error('Could not mark all as read.', { id: toastId });
        }
    };

    const groupedNotifications = useMemo(() => groupNotificationsByDate(notifications), [notifications]);

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading notifications...</div>;
    }

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">Review important updates, alerts, and announcements.</p>
                </div>
                <button 
                    onClick={markAllAsRead}
                    disabled={!notifications.some(n => !n.read)}
                    className="flex items-center gap-2 bg-white text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCheck size={18} />
                    Mark all as read
                </button>
            </div>

            {notifications.length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedNotifications).map(([group, notifs]) => (
                        notifs.length > 0 && (
                            <div key={group}>
                                <h2 className="text-sm font-semibold text-gray-500 mb-2">{group}</h2>
                                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <ul className="divide-y divide-gray-200">
                                        {notifs.map(notif => {
                                            const { icon: Icon, color } = notificationIcons[notif.type] || notificationIcons.default;
                                            return (
                                                <li key={notif._id} className={`p-4 flex items-start gap-4 transition-colors ${!notif.read ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                                                    <div className={`h-10 w-10 ${color} rounded-full flex-shrink-0 flex items-center justify-center`}>
                                                        <Icon className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className="text-sm text-gray-800">{notif.message}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                                                    </div>
                                                    {!notif.read && (
                                                        <div className="h-2.5 w-2.5 bg-blue-500 rounded-full mt-1.5" title="Unread"></div>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                    <Mail className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">All Caught Up!</h3>
                    <p className="mt-1 text-sm text-gray-500">You have no new notifications.</p>
                </div>
            )}
        </div>
    );
}
