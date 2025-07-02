'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, Menu, Clock, Star, Check, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/helpers/axiosInstance';

// --- Notification Popover Component ---
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

    const handleBellClick = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
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

    const notificationIcons = {
        new_review: { icon: Star, bg: 'bg-yellow-100', text: 'text-yellow-600' },
        default: { icon: Check, bg: 'bg-blue-100', text: 'text-blue-600' }
    };
    
    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={handleBellClick} className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <Bell size={22}/>
                {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </button>
            
            {isOpen && (
                 <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="p-4 border-b">
                        <h4 className="font-semibold text-gray-800">Notifications</h4>
                    </div>
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {loading ? <p className="text-center p-4 text-sm text-gray-500">Loading...</p> : 
                            notifications.length > 0 ? (
                                notifications.map(notif => {
                                    const Icon = notificationIcons[notif.type]?.icon || notificationIcons.default.icon;
                                    const bgColor = notificationIcons[notif.type]?.bg || notificationIcons.default.bg;
                                    const textColor = notificationIcons[notif.type]?.text || notificationIcons.default.text;

                                    return (
                                        <Link href={notif.link || '#'} key={notif._id} className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100">
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 p-2 rounded-full ${bgColor} ${textColor}`}>
                                                    <Icon size={20}/>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{notif.message}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{new Date(notif.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })
                            ) : (
                                <p className="text-center p-4 text-sm text-gray-500">No new notifications.</p>
                            )
                        }
                    </div>
                     <div className="p-2 border-t bg-gray-50 rounded-b-xl">
                        <Link href="/company/notifications" onClick={() => setIsOpen(false)} className="block w-full text-center text-sm font-semibold text-blue-600 hover:underline">
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Header Component ---
export default function Header({ onMobileMenuToggle }) {
    const { user, logout } = useUser();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const profileRef = useRef(null);
    const searchRef = useRef(null);

    useEffect(() => {
        try {
            const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
            setSearchHistory(history);
        } catch (error) {
            setSearchHistory([]);
        }
    }, []);

    const handleSearchSubmit = (e, query) => {
        e.preventDefault();
        const term = (query || searchQuery).trim();
        if (!term) return;

        const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));

        setIsSearchFocused(false);
        setSearchQuery('');
        router.push(`/search?q=${encodeURIComponent(term)}`);
    };

    const handleLogout = () => {
        toast.success('Logged out successfully');
        logout(); // This will now handle the redirect
    };

    const handleClearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
        setIsSearchFocused(false);
    };
    
    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchFocused(false);
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
            
            <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
                <div className="relative flex flex-1" ref={searchRef}>
                    <form className="relative w-full" onSubmit={handleSearchSubmit}>
                        <label htmlFor="search-field" className="sr-only">Search</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input id="search-field" value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                className="block h-full w-full rounded-md border-0 bg-gray-100 py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                placeholder="Search courses..."
                                type="search"
                                name="search"
                                autoComplete="off"
                            />
                        </div>
                    </form>
                    
                    {isSearchFocused && searchHistory.length > 0 && (
                        <div className="absolute top-full mt-2 w-full rounded-md bg-white shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                            <ul className="py-1">
                                {searchHistory.map((item, index) => (
                                    <li key={index} 
                                        onClick={(e) => handleSearchSubmit(e, item)}
                                        className="flex items-center gap-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <Clock className="h-4 w-4 text-gray-400"/>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-gray-100 p-2">
                                <button onClick={handleClearHistory} className="w-full flex items-center justify-center gap-2 text-xs text-red-500 font-semibold hover:bg-red-50 rounded-md p-1.5">
                                    <Trash2 size={14} />
                                    Clear History
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <NotificationPopover />
                    
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
                    
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="-m-1.5 flex items-center p-1.5">
                            <span className="sr-only">Open user menu</span>
                            {user?.avatar?.url ? (
                                <img className="h-8 w-8 rounded-full bg-gray-50 object-cover" src={user.avatar.url} alt="Company Logo" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                                    {getInitials(user?.name)}
                                </div>
                            )}
                        </button>
                        
                        {isProfileOpen && (
                             <div className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                <div className="px-3 py-2 border-b">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <div className="py-1">
                                    <Link href="/company/profile" onClick={() => setIsProfileOpen(false)} className="block px-3 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-50">View Profile</Link>
                                    <button onClick={handleLogout} className="w-full text-left block px-3 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-50 border-t mt-1 pt-2">Sign out</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
