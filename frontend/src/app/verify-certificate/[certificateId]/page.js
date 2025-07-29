// LMS/frontend/src/app/verify-certificate/[certificateId]/page.js
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Award, CheckCircle, XCircle, FileDown, BookOpen, User, CalendarDays } from 'lucide-react';
import axios from 'axios'; // Use plain axios as it's a public route and no token is needed
import { toast } from 'react-hot-toast'; // For toast notifications

// Main component content to be wrapped in Suspense
function VerifyCertificateContent() {
    const { certificateId } = useParams();
    const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, invalid
    const [certificateData, setCertificateData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!certificateId) return;

        const verifyCertificate = async () => {
            try {
                setVerificationStatus('loading');
                setError(null);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const { data } = await axios.get(`${apiUrl}/certificates/verify/${certificateId}`);
                
                setCertificateData(data.certificate);
                setVerificationStatus('success');
                toast.success(data.message);
            } catch (err) {
                console.error("Certificate verification failed:", err);
                const errorMessage = err.response?.data?.message || 'Certificate verification failed. Please try again or ensure the ID is correct.';
                setError(errorMessage);
                setVerificationStatus('invalid');
                toast.error(errorMessage);
            }
        };

        verifyCertificate();
    }, [certificateId]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-xl w-full text-center">
                {verificationStatus === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                        <h2 className="text-xl font-bold text-gray-800">Verifying Certificate...</h2>
                        <p className="text-gray-600">Please wait while we check the certificate details.</p>
                    </div>
                )}

                {verificationStatus === 'success' && certificateData && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-green-700 mb-2">Certificate Successfully Verified!</h2>
                        <p className="text-gray-600 mb-6">This is a valid certificate issued by EduFlex.</p>

                        <div className="w-full text-left bg-gray-50 rounded-lg p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <Award className="h-6 w-6 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Course Title</p>
                                    <p className="font-semibold text-gray-900">{certificateData.courseTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="h-6 w-6 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Student Name</p>
                                    <p className="font-semibold text-gray-900">{certificateData.studentName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <User className="h-6 w-6 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Instructor</p>
                                    <p className="font-semibold text-gray-900">{certificateData.instructorName || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <CalendarDays className="h-6 w-6 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Completion Date</p>
                                    <p className="font-semibold text-gray-900">{certificateData.completionDate}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-blue-500">#</span>
                                <div>
                                    <p className="text-sm text-gray-500">Certificate ID</p>
                                    <p className="font-mono text-xs text-gray-900 break-all">{certificateData.certificateId}</p>
                                </div>
                            </div>
                        </div>

                        {certificateData.certificateUrl && (
                             <a
                                href={certificateData.certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all transform hover:-translate-y-1"
                            >
                                <FileDown className="mr-2 h-5 w-5" /> Download Verified Certificate
                            </a>
                        )}
                       
                    </div>
                )}

                {verificationStatus === 'invalid' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-red-700 mb-2">Verification Failed</h2>
                        <p className="text-gray-600 mb-6">{error || 'This certificate could not be verified. It might be invalid or does not exist.'}</p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:-translate-y-1"
                        >
                            <BookOpen className="mr-2 h-5 w-5" /> Explore Courses
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

// Wrapper to use Suspense for dynamic params
export default function VerifyCertificatePageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-700">Loading verification details...</p>
            </div>
        }>
            <VerifyCertificateContent />
        </Suspense>
    );
}