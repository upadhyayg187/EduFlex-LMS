'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { BookCopy, ClipboardCheck, ClipboardList, AlertCircle, PlayCircle } from 'lucide-react';
import Link from 'next/link';

// Reusable Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.bg}`}>
                <Icon className={`h-6 w-6 ${color.text}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

// Loading Skeleton for Stat Cards
const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-7 bg-gray-200 rounded w-12"></div>
            </div>
        </div>
    </div>
);

export default function StudentDashboard() {
    const { user } = useUser();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await axiosInstance.get('/students/dashboard');
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError('Could not load your dashboard. Please try again later.');
                toast.error('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const statCardsData = [
        { title: 'Courses Enrolled', value: stats?.enrolledCoursesCount ?? '0', icon: BookCopy, color: { bg: 'bg-blue-100', text: 'text-blue-600' } },
        { title: 'Assignments Completed', value: stats?.assignmentsCompletedCount ?? '0', icon: ClipboardCheck, color: { bg: 'bg-green-100', text: 'text-green-600' } },
        { title: 'Assignments Pending', value: stats?.assignmentsPendingCount ?? '0', icon: ClipboardList, color: { bg: 'bg-yellow-100', text: 'text-yellow-600' } },
    ];

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-96 bg-white rounded-xl border-2 border-dashed">
                <AlertCircle className="w-16 h-16 text-red-400" />
                <h2 className="mt-4 text-xl font-semibold text-gray-800">Failed to Load Dashboard</h2>
                <p className="mt-1 text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || 'Student'}!</h1>
                <p className="text-gray-500 mt-1">Let's continue learning.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <>
                        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                    </>
                ) : (
                    statCardsData.map((item) => <StatCard key={item.title} {...item} />)
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
                <div className="mt-4 space-y-4">
                    {loading ? (
                        <p className="text-gray-500">Loading your courses...</p>
                    ) : (
                        stats?.recentCourses.length > 0 ? (
                            stats.recentCourses.map(course => (
                                <Link href={`/student/courses/${course._id}`} key={course._id} className="group flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 transition-all">
                                    <img src={course.thumbnail?.url || 'https://placehold.co/128x72/e0e7ff/3730a3?text=Course'} alt={course.title} className="h-16 w-28 rounded-md bg-gray-100 object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{course.title}</p>
                                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{course.level}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                                        <span className="text-sm font-semibold">Resume</span>
                                        <PlayCircle />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed">
                                <h3 className="text-lg font-medium text-gray-900">No Courses Enrolled</h3>
                                <p className="mt-1 text-sm text-gray-500">Start your learning journey by browsing our courses.</p>
                                <Link href="/search" className="mt-4 inline-block bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg shadow-sm hover:bg-blue-700">
                                    Browse Courses
                                </Link>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
