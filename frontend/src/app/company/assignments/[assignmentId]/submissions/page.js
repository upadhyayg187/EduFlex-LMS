'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { FileText, Clock, CheckCircle, Award } from 'lucide-react';
import Link from 'next/link';

export default function ViewSubmissionsPage() {
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { assignmentId } = useParams();

    useEffect(() => {
        if (!assignmentId) return;

        const fetchSubmissions = async () => {
            try {
                const { data } = await axiosInstance.get(`/assignments/${assignmentId}/submissions`);
                setAssignment(data.assignment);
                setSubmissions(data.submissions);
            } catch (error) {
                toast.error("Could not fetch submissions for this assignment.");
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [assignmentId]);

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading submissions...</div>;
    }

    return (
        <div className="space-y-6">
            <Toaster />
            <div>
                <Link href="/company/assignments" className="text-sm text-blue-600 hover:underline">&larr; Back to all assignments</Link>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">{assignment?.title}</h1>
                <p className="text-sm text-gray-500">Submissions from students for this assignment.</p>
            </div>

             <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Submitted At</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Grade</th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {submissions.length > 0 ? submissions.map(sub => (
                            <tr key={sub._id}>
                                <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="font-medium text-gray-900">{sub.student.name}</div>
                                    <div className="text-gray-500">{sub.student.email}</div>
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                                <td className="px-3 py-4 text-sm"><span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${sub.status === 'Graded' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>{sub.status}</span></td>
                                <td className="px-3 py-4 text-sm font-medium text-gray-900">{sub.grade || 'Not Graded'}</td>
                                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <button className="text-blue-600 hover:text-blue-900">Grade</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center py-10 text-gray-500">No submissions yet for this assignment.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
