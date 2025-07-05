'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { BarChart2, AlertCircle, Award } from 'lucide-react';

const ProgressCard = ({ course }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-5">
        <img
            src={course.thumbnail?.url || 'https://placehold.co/128x72/e0e7ff/475569?text=Course'}
            alt={course.title}
            className="h-20 w-32 rounded-md bg-gray-100 object-contain"
        />
        <div className="flex-grow">
            <p className="font-semibold text-gray-800">{course.title}</p>
            <p className="text-xs text-gray-500 mb-2">by {course.instructor}</p>
            <div className="flex items-center gap-2">
                 <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                </div>
                <span className="text-sm font-medium text-gray-700">{course.progress}%</span>
            </div>
        </div>
        {/* --- FIX: Corrected the link to include '/view/' --- */}
        <Link href={`/student/courses/view/${course._id}`} className="ml-4 flex-shrink-0 px-4 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition">
            Continue
        </Link>
    </div>
);

const ProgressCardSkeleton = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-5 animate-pulse">
        <div className="h-20 w-32 rounded-md bg-gray-200"></div>
        <div className="flex-grow space-y-3">
             <div className="h-5 bg-gray-200 rounded w-3/4"></div>
             <div className="h-4 bg-gray-200 rounded w-1/3"></div>
             <div className="h-2.5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="ml-4 h-9 w-24 bg-gray-200 rounded-lg"></div>
    </div>
);


export default function MyProgressPage() {
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const { data } = await axiosInstance.get('/students/my-progress-overview');
                setProgressData(data);
            } catch (err) {
                console.error("Failed to fetch progress data:", err);
                setError('Could not load your progress. Please try refreshing the page.');
                toast.error('Could not load progress.');
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-96 bg-white rounded-xl border-2 border-dashed">
                <AlertCircle className="w-16 h-16 text-red-400" />
                <h2 className="mt-4 text-xl font-semibold text-gray-800">Error Loading Progress</h2>
                <p className="mt-1 text-gray-500">{error}</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
                <p className="text-gray-500 mt-1">Track your learning journey and see how far you've come.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <ProgressCardSkeleton />
                    <ProgressCardSkeleton />
                </div>
            ) : progressData.length > 0 ? (
                <div className="space-y-4">
                    {progressData.map(course => <ProgressCard key={course._id} course={course} />)}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                    <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Progress to Show Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Enroll in a course and complete a few lessons to see your progress here.</p>
                    <Link href="/search" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700">
                        Browse Courses
                    </Link>
                </div>
            )}
        </div>
    );
}
