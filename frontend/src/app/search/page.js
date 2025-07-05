'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';
import { BookOpen, AlertTriangle, Star } from 'lucide-react';
import Link from 'next/link';

// Reusable Star Rating component
const StarRating = ({ rating = 0, reviewCount = 0, className = '' }) => (
    <div className={`flex items-center gap-1 ${className}`}>
        <p className="font-bold text-sm text-yellow-500">{rating.toFixed(1)}</p>
        <div className="flex">
            {[...Array(5)].map((_, index) => (
                <Star key={index} className={`h-4 w-4 ${rating > index ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
        <p className="text-xs text-gray-500">({reviewCount})</p>
    </div>
);

// Reusable Course Card Component
const CourseCard = ({ course }) => (
    <Link href={`/courses/${course._id}`} className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
        <div className="h-48 bg-gray-100 flex items-center justify-center">
             <img
                src={course.thumbnail?.url || 'https://placehold.co/600x400/e0e7ff/3730a3?text=Course'}
                alt={course.title}
                className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            />
        </div>
        <div className="p-5">
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
                <StarRating rating={course.averageRating} reviewCount={course.reviewCount} />
            </div>
            <p className="text-sm text-gray-500 mt-2">by {course.createdBy?.name || 'EduFlex'}</p>
        </div>
    </Link>
);

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError('');
            try {
                // --- FIX: If there's a query, use the search endpoint. ---
                // --- If not, use the public endpoint to get all courses. ---
                const endpoint = query ? `/courses/search?q=${query}` : '/courses/public';
                const { data } = await axiosInstance.get(endpoint);
                setResults(data);
            } catch (err) {
                setError('Failed to fetch courses.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/" className="text-blue-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Home</Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {query ? `Search Results for "${query}"` : 'All Courses'}
            </h1>
            
            <div className="mt-8">
                {loading ? (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                             <div key={i} className="rounded-xl border border-gray-200 shadow-sm animate-pulse">
                                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="flex justify-between items-center">
                                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                     <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
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
                        <p className="mt-1 text-sm text-gray-500">{query ? `We couldn't find any courses matching your search for "${query}". Try a different keyword.` : "There are no public courses available at the moment."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrap the component in Suspense for useSearchParams to work correctly
export default function SearchPage() {
    return (
        <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
            <SearchResults />
        </Suspense>
    );
}
