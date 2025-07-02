'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';
import { BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Reusable Course Card Component
const CourseCard = ({ course }) => (
    <Link href={`/courses/${course._id}`} className="group block overflow-hidden rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="h-56 bg-gray-100 flex items-center justify-center">
             <img
                src={course.thumbnail?.url || 'https://placehold.co/600x400/e0e7ff/3730a3?text=Course'}
                alt={course.title}
                // --- FIX: Changed 'object-cover' to 'object-contain' ---
                className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            />
        </div>
        <div className="p-5 bg-white">
            <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                course.level === 'Beginner' ? 'bg-green-100 text-green-700' :
                course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
            }`}>
                {course.level}
            </span>
            <h3 className="mt-4 text-lg font-bold text-gray-900">{course.title}</h3>
            <div className="mt-2 flex items-center justify-between">
                <p className="text-gray-700 font-semibold">₹{course.price}</p>
                <p className="text-sm text-gray-500">{course.createdBy?.name || 'EduFlex'}</p>
            </div>
        </div>
    </Link>
);


export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch all public courses and filter on the client-side
                const { data } = await axiosInstance.get('/courses/public');
                const lowerCaseQuery = query.toLowerCase();
                const filtered = data.filter(course => 
                    course.title.toLowerCase().includes(lowerCaseQuery) ||
                    (course.tags && course.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
                );
                setResults(filtered);
            } catch (err) {
                setError('Failed to fetch search results.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Search Results for "{query}"
            </h1>
            
            <div className="mt-8">
                {loading ? (
                    <p className="text-gray-500">Searching...</p>
                ) : error ? (
                     <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle size={20}/> <span>{error}</span>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                       {results.map(course => <CourseCard key={course._id} course={course} />)}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No Courses Found</h3>
                        <p className="mt-1 text-sm text-gray-500">We couldn't find any courses matching your search. Try a different keyword.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
