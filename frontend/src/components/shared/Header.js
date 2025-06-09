'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axiosInstance from '@/helpers/axiosInstance';

export default function Header() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
            toast.success('Logged out successfully');
            router.push('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    return (
        <header className="bg-white shadow-md">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                <Link href="/" className="text-xl font-bold text-gray-800">
                    LMS Platform
                </Link>
                <div>
                    {/* We can add user info and role-specific links here later */}
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
            </nav>
        </header>
    );
}