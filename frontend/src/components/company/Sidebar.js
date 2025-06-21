// src/components/company/Sidebar.js
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  BookCopy,
  Users,
  ClipboardList,
  Star,
  Bell,
  Settings,
  LogOut,
  PlusCircle,
  LifeBuoy,
} from 'lucide-react';
import useUser from '@/hooks/useUser';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/company/dashboard', icon: Home },
  { label: 'Manage Courses', href: '/company/courses', icon: BookCopy },
  { label: 'Students', href: '/company/students', icon: Users },
  { label: 'Assignments', href: '/company/assignments', icon: ClipboardList },
  { label: 'Reviews', href: '/company/reviews', icon: Star },
];

const bottomNavItems = [
    { label: 'Notifications', href: '/company/notifications', icon: Bell },
    { label: 'Support', href: '/company/support', icon: LifeBuoy },
];

// New Professional Logo Component
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

export default function Sidebar() {
  const pathname = usePathname();
  const user = useUser();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('eduflex-user');
    toast.success('Successfully logged out!');
    router.push('/Login');
  };

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
            <Logo />
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
                {/* THE ONLY CHANGE IS IN THE LINE BELOW: `focus-visible:outline` has been removed. */}
                <Link href="/company/create-course" className="flex items-center justify-center gap-x-3 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                    <PlusCircle className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                    Create New Course
                </Link>
            </li>
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400">Main Menu</div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          pathname === item.href // Use strict equality for perfect matching
                            ? 'bg-gray-100 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-6 w-6 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">Tools & Help</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                 {bottomNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          pathname === item.href
                            ? 'bg-gray-100 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-6 w-6 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                </ul>
            </li>
            <li className="mt-auto">
                <div className="-mx-2 space-y-1 pt-4 border-t border-gray-100">
                    <Link href="/company/profile" className="group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50">
                        <Settings className="h-6 w-6 shrink-0" />
                        Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50">
                        <LogOut className="h-6 w-6 shrink-0" />
                        Logout
                    </button>
                </div>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
