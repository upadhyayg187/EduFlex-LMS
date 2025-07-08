'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  LayoutDashboard, Building, Users, BookCopy, Settings, LogOut, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Manage Companies', href: '/admin/companies', icon: Building },
  { label: 'Manage Students', href: '/admin/students', icon: Users },
  { label: 'Manage Courses', href: '/admin/courses', icon: BookCopy },
];

const Logo = () => (
    <div className="flex items-center gap-x-3">
        <div className="bg-blue-600 p-2 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="rgba(255,255,255,0.6)"/>
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">EduFlex</h2>
    </div>
);

const NavLink = ({ item, pathname, onClick }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
        <li>
            <Link href={item.href} onClick={onClick}
                className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                    isActive ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
            >
                <Icon className="h-6 w-6 shrink-0" />
                {item.label}
            </Link>
        </li>
    );
};

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
    const pathname = usePathname();
    const { logout } = useUser();

    const handleLogout = () => {
        toast.success('Logged out successfully!');
        logout();
    };

    const sidebarContent = (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center justify-between">
                <Logo />
                <p className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">ADMIN</p>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navItems.map((item) => <NavLink key={item.label} item={item} pathname={pathname} onClick={() => setSidebarOpen(false)} />)}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <div className="-mx-2 space-y-1 pt-4 border-t border-gray-100">
                            <Link href="/admin/settings" onClick={() => setSidebarOpen(false)} className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50">
                                <Settings className="h-6 w-6 shrink-0" /> Platform Settings
                            </Link>
                            <button onClick={handleLogout} className="w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50">
                                <LogOut className="h-6 w-6 shrink-0" /> Logout
                            </button>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    );

    return (
        <>
            {/* Mobile sidebar */}
            <div className={`relative z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div className="fixed inset-0 bg-gray-900/80" />
                <div className="fixed inset-0 flex">
                    <div className="relative mr-16 flex w-full max-w-xs flex-1">
                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                            <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>
                        {sidebarContent}
                    </div>
                </div>
            </div>
            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                {sidebarContent}
            </div>
        </>
    );
}