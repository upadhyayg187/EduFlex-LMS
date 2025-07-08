'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Menu, Shield, UserPlus, FileText, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/helpers/axiosInstance';
import { formatDistanceToNow } from 'date-fns';

// --- NEW NOTIFICATION POPOVER COMPONENT ---
const NotificationPopover = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const popoverRef = useRef(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get('/notifications?limit=5');
            setNotifications(data);
            if (data.some(notif => !notif.read)) {
                setHasUnread(true);
            } else {
                setHasUnread(false);
            }
        } catch (error) {
            toast.error('Could not fetch notifications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };
    
    const notificationIcons = {
        new_company: UserPlus,
        course_published: FileText,
        default: Bell,
    };

    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={handleBellClick} type="button" className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <Bell size={22}/>
                {hasUnread && <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">Notifications</h3>
                    </div>
                    <ul className="divide-y max-h-96 overflow-y-auto">
                        {loading ? <li className="p-4 text-center text-sm text-gray-500">Loading...</li> :
                         notifications.length > 0 ? notifications.map(notif => {
                            const Icon = notificationIcons[notif.type] || notificationIcons.default;
                            return (
                                <li key={notif._id} className={`p-4 hover:bg-gray-50 ${!notif.read && 'bg-blue-50'}`}>
                                    <Link href={notif.link || '#'} className="flex items-start gap-3">
                                        <div className="mt-1"><Icon size={20} className="text-gray-500"/></div>
                                        <div>
                                            <p className="text-sm text-gray-700">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                                        </div>
                                    </Link>
                                </li>
                            )
                        }) : <li className="p-4 text-center text-sm text-gray-500">No new notifications.</li>}
                    </ul>
                     <div className="p-2 bg-gray-50 border-t">
                        <Link href="/admin/notifications" onClick={() => setIsOpen(false)} className="block text-center text-sm font-semibold text-blue-600 hover:underline">View all notifications</Link>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- MAIN HEADER COMPONENT ---
export default function Header({ onMobileMenuToggle }) {
    const { user, logout } = useUser();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    
    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
    };
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={onMobileMenuToggle}>
                <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <NotificationPopover />
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 -m-1.5 p-1.5">
                            <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold"><Shield size={16} /></div>
                            <span className="hidden lg:flex lg:items-center"><span className="text-sm font-semibold leading-6 text-gray-900">{user?.name || 'Admin'}</span></span>
                        </button>
                        
                        {isProfileOpen && (
                             <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                <div className="px-3 py-2 border-b">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <div className="py-1">
                                    <button onClick={handleLogout} className="w-full text-left block px-3 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-50">Sign out</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}