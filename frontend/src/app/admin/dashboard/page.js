'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Building, Users, BookCopy, IndianRupee, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Reusable Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color.bg}`}>
                <Icon className={`h-6 w-6 ${color.text}`} />
            </div>
        </div>
    </div>
);

// Loading Skeleton for Stat Cards
const StatCardSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
        </div>
    </div>
);

export default function AdminDashboard() {
    const { user } = useUser();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data } = await axiosInstance.get('/admins/dashboard-stats');
                setStats(data);
            } catch (err) {
                setError('Could not load dashboard statistics.');
                toast.error('Failed to load dashboard statistics.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const statCardsData = [
        { title: 'Total Revenue', value: `₹${stats?.totalRevenue || 0}`, icon: IndianRupee, color: { bg: 'bg-green-100', text: 'text-green-600' } },
        { title: 'Total Companies', value: stats?.totalCompanies ?? '0', icon: Building, color: { bg: 'bg-blue-100', text: 'text-blue-600' } },
        { title: 'Total Students', value: stats?.totalStudents ?? '0', icon: Users, color: { bg: 'bg-indigo-100', text: 'text-indigo-600' } },
        { title: 'Total Courses', value: stats?.totalCourses ?? '0', icon: BookCopy, color: { bg: 'bg-yellow-100', text: 'text-yellow-600' } },
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
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 mt-1">Platform-wide overview and statistics.</p>
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

            <div>
                <h2 className="text-xl font-bold text-gray-900">Recently Joined Companies</h2>
                <div className="mt-4 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                         <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="3" className="p-4 text-center">Loading...</td></tr>
                            ) : (
                                stats?.recentCompanies.map((company) => (
                                    <tr key={company._id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(company.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}