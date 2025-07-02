'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { TrendingUp, BookOpen, Users, Star, AlertCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

// Reusable Star Rating component
const StarRating = ({ rating = 0, size = 'h-4 w-4' }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
            <Star key={index} className={`${size} ${rating > index ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        ))}
    </div>
);

// Redesigned, clickable Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Link href={link} className="group block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.bg} group-hover:scale-110 transition-transform`}>
                <Icon className={`h-6 w-6 ${color.text}`} />
            </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </Link>
);

// Loading Skeletons
const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mt-2"></div>
    </div>
);

const ChartSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-md"></div>
    </div>
);

export default function CompanyDashboard() {
    const { user } = useUser();
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, chartRes] = await Promise.all([
                    axiosInstance.get('/companies/dashboard-stats'),
                    axiosInstance.get('/companies/dashboard-chart-data')
                ]);
                setStats(statsRes.data);
                setChartData(chartRes.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError('Could not load dashboard data. Please try again later.');
                toast.error('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCardsData = [
        { title: 'Total Revenue', value: `₹${stats?.totalRevenue || 0}`, icon: TrendingUp, color: { bg: 'bg-green-100', text: 'text-green-600' }, link: '#' },
        { title: 'Active Courses', value: stats?.totalCourses ?? '0', icon: BookOpen, color: { bg: 'bg-blue-100', text: 'text-blue-600' }, link: '/company/courses' },
        { title: 'Total Students', value: stats?.newStudentsCount ?? '0', icon: Users, color: { bg: 'bg-indigo-100', text: 'text-indigo-600' }, link: '/company/students' },
        { title: 'Average Rating', value: stats?.averageRating.toFixed(2) ?? 'N/A', icon: Star, color: { bg: 'bg-yellow-100', text: 'text-yellow-600' }, link: '/company/reviews' },
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
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back, {user?.name || 'Company'} 👋</h1>
                <p className="text-gray-500 mt-1">Here's a summary of your company's performance.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    <>
                        <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
                    </>
                ) : (
                    statCardsData.map((item) => <StatCard key={item.title} {...item} />)
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Student Enrollment Chart */}
                <div className="lg:col-span-2">
                     {loading ? <ChartSkeleton /> : (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">New Student Enrollment</h3>
                            <p className="text-sm text-gray-500 mb-4">Last 6 months</p>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} contentStyle={{background: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb'}}/>
                                        <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                     )}
                </div>

                {/* Recent Reviews */}
                <div className="lg:col-span-1">
                     {loading ? <ChartSkeleton /> : (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
                            <h3 className="text-lg font-semibold text-gray-800">Recent Reviews</h3>
                             <div className="mt-4 space-y-4">
                                {stats?.recentReviews.length > 0 ? (
                                    stats.recentReviews.map(review => (
                                        <div key={review._id} className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center font-bold text-gray-600">
                                                {review.student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{review.student.name}</p>
                                                <StarRating rating={review.rating} />
                                                <p className="text-xs text-gray-500 mt-1">"{review.comment.substring(0, 50)}..."</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <MessageSquare className="mx-auto h-10 w-10 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-500">No reviews yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
}
