'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { BookOpen, AlertCircle } from 'lucide-react';
import Image from 'next/image';

const CourseCard = ({ course }) => (
    <Link href={`/student/courses/view/${course._id}`} className="group block overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="relative h-48 bg-gray-100">
             <Image
                src={course.thumbnail?.url || "https://placehold.co/600x400/e0e7ff/475569?text=Course"}
                alt={course.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'contain' }}
            />
        </div>
        <div className="p-5">
             <p className="text-sm font-semibold text-blue-600">{course.level}</p>
             <h3 className="mt-2 font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{course.title}</h3>
             <p className="mt-1 text-xs text-gray-500">by {course.createdBy?.name || 'EduFlex'}</p>
             {/* --- FIX: Use the real course.progress data --- */}
             <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
             </div>
             <p className="text-right text-xs text-gray-500 mt-1">{course.progress}% complete</p>
        </div>
    </Link>
);

const CourseCardSkeleton = () => (
    <div className="rounded-xl bg-white shadow-sm border border-gray-200 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-t-xl"></div>
        <div className="p-5 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-5 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/4"></div>
            <div className="h-2 bg-gray-200 rounded-full mt-4"></div>
        </div>
    </div>
);


export default function MyCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            try {
                const { data } = await axiosInstance.get('/students/my-courses');
                setCourses(data);
            } catch (err) {
                console.error("Failed to fetch enrolled courses:", err);
                setError('Could not load your courses. Please try refreshing the page.');
                toast.error('Could not load your courses.');
            } finally {
                setLoading(false);
            }
        };

        fetchEnrolledCourses();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-96 bg-white rounded-xl border-2 border-dashed">
                <AlertCircle className="w-16 h-16 text-red-400" />
                <h2 className="mt-4 text-xl font-semibold text-gray-800">Error Loading Courses</h2>
                <p className="mt-1 text-gray-500">{error}</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                <p className="text-gray-500 mt-1">Continue your learning journey. Here are all the courses you&apos;re enrolled in.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <CourseCardSkeleton key={i} />)}
                </div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => <CourseCard key={course._id} course={course} />)}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">You Haven&apos;t Enrolled in Any Courses Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start your learning journey by Browse our course catalog.</p>
                    <Link href="/search" className="mt-6 inline-block bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700">
                        Browse Courses
                    </Link>
                </div>
            )}
        </div>
    );
}
