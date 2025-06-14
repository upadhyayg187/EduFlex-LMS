'use client';

import { Bell, ChevronDown, LogOut, Moon, User, Lock } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import useUser from '@/hooks/useUser';
import useTheme from '@/hooks/useTheme';
import Link from 'next/link';

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const user = useUser();
  const router = useRouter();
  const [theme, toggleTheme] = useTheme(); // 🌙 Theme logic

  // 🔒 Logout handler
  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      localStorage.removeItem('eduflex-user');
      toast.success('Successfully logged out!');
      router.push('/Login');
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white  dark:bg-gray-800  shadow-sm transition-colors">
      {/* Title & subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Company Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Welcome back to your admin panel</p>
      </div>

      {/* Notifications and User Dropdown */}
      <div className="flex items-center gap-6">
        {/* 🔔 Notification Icon */}
        <div className="relative cursor-pointer">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1">3</span>
        </div>

        {/* 👤 User Dropdown */}
        <div className="relative">
          <button onClick={toggleDropdown} className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 text-white rounded-full font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() || 'CA'}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-300" />
          </button>

          {/* 🔽 Dropdown Content */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || 'Company Admin'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email || 'admin@eduflex.com'}
                </p>
              </div>

              <ul className="py-2">
                {/* Profile link */}
                <li>
                  <Link href="/company/profile">
                    <span className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> My Profile
                    </span>
                  </Link>
                </li>

                {/* Change Password link */}
                <li>
                  <Link href="/company/change-password">
                    <span className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                      <Lock className="mr-2 h-4 w-4" /> Change Password
                    </span>
                  </Link>
                </li>

                {/* 🌙 Theme toggle button */}
                <li>
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Moon className="mr-2 h-4 w-4" /> Toggle Theme
                  </button>
                </li>
              </ul>

              {/* 🔓 Logout */}
              <div className="border-t dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
