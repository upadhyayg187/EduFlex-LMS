'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Star, MessageSquare, Search, Filter, ChevronDown } from 'lucide-react';

// Reusable Star Rating component for displaying ratings
const StarRating = ({ rating = 0, size = 'h-5 w-5' }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
            <Star key={index} className={`${size} ${rating > index ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
    </div>
);

// Component for the rating distribution bars
const RatingBar = ({ rating, count, maxCount }) => {
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">{rating} star</span>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <span className="text-gray-500 w-8 text-right">{count}</span>
        </div>
    );
};

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState(0); // 0 for all
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const { data } = await axiosInstance.get('/feedback/company');
                setReviews(data);
            } catch (error) {
                toast.error('Could not fetch course reviews.');
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    // Memoize calculations for performance
    const { averageRating, totalReviews, ratingDistribution, maxRatingCount } = useMemo(() => {
        if (reviews.length === 0) {
            return { averageRating: 0, totalReviews: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, maxRatingCount: 0 };
        }
        const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
        const avg = totalRating / reviews.length;
        
        const distribution = reviews.reduce((acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
        }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

        const maxCount = Math.max(...Object.values(distribution));

        return {
            averageRating: avg.toFixed(2),
            totalReviews: reviews.length,
            ratingDistribution: distribution,
            maxRatingCount: maxCount,
        };
    }, [reviews]);

    const filteredAndSortedReviews = useMemo(() => {
        return reviews
            .filter(review => {
                const matchesSearch = review.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      review.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesRating = filterRating === 0 || review.rating === filterRating;
                return matchesSearch && matchesRating;
            })
            .sort((a, b) => {
                if (sortBy === 'newest') {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                if (sortBy === 'highest') {
                    return b.rating - a.rating;
                }
                return 0;
            });
    }, [reviews, searchTerm, filterRating, sortBy]);

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading reviews...</div>;
    }

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Reviews</h1>
                <p className="text-sm text-gray-500 mt-1">View feedback and ratings from students on your courses.</p>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center">
                    <p className="text-sm font-medium text-gray-500">Overall Average Rating</p>
                    <p className="text-4xl font-bold text-gray-800 mt-2">{averageRating}</p>
                    <div className="mt-2">
                        <StarRating rating={averageRating} size="h-6 w-6" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">based on {totalReviews} reviews</p>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Distribution</h3>
                    <div className="space-y-2">
                        <RatingBar rating={5} count={ratingDistribution[5]} maxCount={maxRatingCount} />
                        <RatingBar rating={4} count={ratingDistribution[4]} maxCount={maxRatingCount} />
                        <RatingBar rating={3} count={ratingDistribution[3]} maxCount={maxRatingCount} />
                        <RatingBar rating={2} count={ratingDistribution[2]} maxCount={maxRatingCount} />
                        <RatingBar rating={1} count={ratingDistribution[1]} maxCount={maxRatingCount} />
                    </div>
                </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="relative flex-grow w-full md:w-auto">
                    <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                    <input type="text" placeholder="Search reviews, courses, or students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"/>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow">
                        <Filter className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                        <select onChange={(e) => setFilterRating(Number(e.target.value))} className="pl-10 pr-8 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600">
                            <option value="0">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                     <div className="relative flex-grow">
                        <ChevronDown className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                        <select onChange={(e) => setSortBy(e.target.value)} className="pl-10 pr-8 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600">
                            <option value="newest">Sort by Newest</option>
                            <option value="highest">Sort by Highest Rating</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredAndSortedReviews.length > 0 ? (
                    filteredAndSortedReviews.map((review) => (
                        <div key={review._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                     <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                        {review.student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{review.student.name}</div>
                                        <div className="text-sm text-gray-500">
                                            reviewed <span className="font-medium text-blue-600">{review.course.title}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <StarRating rating={review.rating} />
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-700 mt-4 pl-14 border-l-2 border-gray-100 ml-5">
                                {review.comment}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No Reviews Found</h3>
                        <p className="mt-1 text-sm text-gray-500">There are no reviews that match your current filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
