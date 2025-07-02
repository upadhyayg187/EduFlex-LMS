'use client';

import { useUser } from '@/context/UserContext';
import { Mail, Briefcase, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, loading } = useUser();

    if (loading) {
        return <div className="text-center p-10 font-semibold">Loading Profile...</div>;
    }

    if (!user) {
        return <div className="text-center p-10 font-semibold">Could not load user profile.</div>;
    }

    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '');

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gray-100" />
                <div className="px-6 py-4 sm:px-8">
                    <div className="-mt-16 flex items-end gap-5">
                        {user.avatar?.url ? (
                            <img src={user.avatar.url} alt="Company Logo" className="h-28 w-28 rounded-full object-cover border-4 border-white bg-gray-200" />
                        ) : (
                            <div className="h-28 w-28 rounded-full bg-blue-600 text-white flex items-center justify-center text-5xl font-bold border-4 border-white">
                                {getInitials(user.name)}
                            </div>
                        )}
                        <div className="pb-2">
                             <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                             <p className="text-sm text-gray-500">Company Profile</p>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                        <Link href="/company/settings" className="px-4 py-2 bg-gray-100 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-200">
                            Edit Profile
                        </Link>
                    </div>

                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <Mail size={16}/> Email Address
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                            </div>
                             <div className="sm:col-span-1">
                                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <Briefcase size={16}/> Industry
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">{user.industry || 'Not specified'}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <Calendar size={16} /> Member Since
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    }) : 'Date not available'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
