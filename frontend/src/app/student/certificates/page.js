// LMS/frontend/src/app/student/certificates/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Award, FileDown, AlertCircle } from 'lucide-react';
import axiosInstance from '@/helpers/axiosInstance'; // Import your configured axios instance
import { toast } from 'react-hot-toast'; // For toast notifications
import { format } from 'date-fns'; // For date formatting

// Reusable CertificateCard Component
const CertificateCard = ({ certificate }) => {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-shrink-0 bg-blue-100 text-blue-600 p-3 rounded-full">
                        <Award size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            Certificate for <span className="text-blue-600">{certificate.course.title}</span>
                        </h3>
                        <p className="text-sm text-gray-500">
                            Issued on {format(new Date(certificate.completionDate), 'PP')}
                        </p>
                    </div>
                </div>
                <div className="mb-4 text-gray-700">
                    <p className="text-sm">Awarded to: <span className="font-semibold">{certificate.student.name}</span></p>
                    <p className="text-sm">Instructor: <span className="font-semibold">{certificate.course.instructorName || 'N/A'}</span></p>
                    <p className="text-sm">ID: <span className="font-mono text-xs text-gray-600">{certificate.certificateId}</span></p>
                </div>
                <div className="flex justify-between items-center mt-6">
                    <a
                        href={certificate.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-green-600 transition-colors"
                    >
                        <FileDown className="mr-2 h-5 w-5" /> Download PDF
                    </a>
                    <Link
                        href={`/verify-certificate/${certificate.certificateId}`} // Link to public verification page
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                        Verify Certificate <span aria-hidden="true" className="ml-1">&rarr;</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Skeleton Loader Component
const CertificateCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
            <div className="flex-shrink-0 bg-gray-200 h-10 w-10 rounded-full"></div>
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        </div>
        <div className="space-y-2 text-gray-700 mb-4">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="flex justify-between items-center mt-6">
            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
            <div className="h-5 bg-gray-200 rounded w-24"></div>
        </div>
    </div>
);


export default function MyCertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                setLoading(true);
                const { data } = await axiosInstance.get('/students/certificates'); // API endpoint
                setCertificates(data);
            } catch (err) {
                console.error("Failed to fetch certificates:", err);
                setError('Failed to load certificates. Please try again.');
                toast.error('Failed to load certificates.');
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
                <Link
                    href="/search"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-all"
                >
                    <BookOpen className="mr-2 h-5 w-5" /> Browse More Courses
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <CertificateCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded-lg flex items-center justify-center text-red-700">
                    <AlertCircle className="h-5 w-5 mr-3" /> {error}
                </div>
            ) : certificates.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-xl shadow-sm">
                    <Award className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">No Certificates Earned Yet!</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Complete courses that offer certificates to see them here.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/search"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Explore Courses
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => (
                        <CertificateCard key={cert._id} certificate={cert} />
                    ))}
                </div>
            )}
        </div>
    );
}