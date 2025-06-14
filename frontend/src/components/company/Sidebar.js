// src/components/company/Sidebar.js
'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  PlusSquare,
  Users,
  FileText,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/company/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'My Courses', href: '/company/courses', icon: <BookOpen size={20} /> },
  { label: 'Create Course', href: '/company/create-course', icon: <PlusSquare size={20} /> },
  { label: 'Students', href: '/company/students', icon: <Users size={20} /> },
  { label: 'Assignments', href: '/company/assignments', icon: <FileText size={20} /> },
  { label: 'Reviews', href: '/company/reviews', icon: <MessageCircle size={20} /> },
  { label: 'Notifications', href: '/company/notifications', icon: <Bell size={20} /> },
  { label: 'Settings', href: '/company/profile', icon: <Settings size={20} /> },
 
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-white border-r shadow-md px-4 py-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-8">EduFlex</h2>
      <nav>
        <ul className="space-y-4">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
