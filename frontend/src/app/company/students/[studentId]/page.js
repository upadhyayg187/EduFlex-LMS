'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Mail, Calendar, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ViewStudentProfilePage() {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (!studentId) return;
        const fetchStudentProfile = async () => {
            try {
                const { data } = await axiosInstance.get(`/companies/student/${studentId}`);
                setStudent(data);
            } catch (err) {
                console.error("Failed to fetch student profile:", err);
                setError(err.response?.data?.message || "Could not load student profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchStudentProfile();
    }, [studentId]);

    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

    if (loading) return <div className="text-center p-10 font-semibold">Loading Profile...</div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center text-center h-96 bg-white rounded-xl border-2 border-dashed">
            <AlertCircle className="w-16 h-16 text-red-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">Error</h2>
            <p className="mt-1 text-gray-500">{error}</p>
            <button onClick={() => router.back()} className="mt-6 bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg shadow-sm hover:bg-blue-700">Go Back</button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <Toaster position="top-center" />
            <div className="mb-6">
                <Link href="/company/students" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600">
                    <ArrowLeft size={18} />
                    Back to All Students
                </Link>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="px-6 py-4 sm:px-8">
                    <div className="-mt-16 flex items-end gap-5">
                        <div className="h-28 w-28 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-5xl font-bold border-4 border-white">
                            {getInitials(student.name)}
                        </div>
                        <div className="pb-2">
                             <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                             <p className="text-sm text-gray-500">Student Profile</p>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-200 pt-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500"><Mail size={16}/> Email Address</dt>
                                <dd className="mt-1 text-sm text-gray-900">{student.email}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="flex items-center gap-2 text-sm font-medium text-gray-500"><Calendar size={16} /> Date Joined</dt>
                                <dd className="mt-1 text-sm text-gray-900">{new Date(student.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}
