'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, Menu } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Header({ onMobileMenuToggle }) {
    const { user, logout } = useUser();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    
    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
    };
    
    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '');

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
                    <button type="button" className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                        <Bell size={22}/>
                    </button>
                    
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
                    
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 -m-1.5 p-1.5">
                            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                                {getInitials(user?.name)}
                            </div>
                            <span className="hidden lg:flex lg:items-center">
                                <span className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                    {user?.name || 'Student'}
                                </span>
                            </span>
                        </button>
                        
                        {isProfileOpen && (
                             <div className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                                <div className="px-3 py-2 border-b">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <div className="py-1">
                                    <Link href="#" onClick={() => setIsProfileOpen(false)} className="block px-3 py-2 text-sm leading-6 text-gray-700 hover:bg-gray-50">My Profile</Link>
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
