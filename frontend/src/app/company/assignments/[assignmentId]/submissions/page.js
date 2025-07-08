'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { FileText, Clock, CheckCircle, Award, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// New Grade Modal Component
const GradeModal = ({ isOpen, onClose, submission, onGradeSaved }) => {
    const formik = useFormik({
        initialValues: {
            grade: submission?.grade || '',
            feedback: submission?.feedback || '',
        },
        validationSchema: Yup.object({
            grade: Yup.string().required('A grade is required.'),
            feedback: Yup.string(),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const toastId = toast.loading('Submitting grade...');
            try {
                const { data } = await axiosInstance.put(`/submissions/${submission._id}/grade`, values);
                onGradeSaved(data); // Pass updated submission data back to parent
                toast.success('Grade submitted successfully!', { id: toastId });
                resetForm();
                onClose();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to submit grade.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
        enableReinitialize: true,
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Grade Submission</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="mt-4">
                    <p><strong>Student:</strong> {submission.student.name}</p>
                    <p className="text-sm"><strong>Submitted File:</strong> 
                        <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                            View File <ExternalLink size={14} className="inline-block" />
                        </a>
                    </p>
                </div>
                <form onSubmit={formik.handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">Grade</label>
                        <input id="grade" name="grade" {...formik.getFieldProps('grade')} className="mt-1 w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., A+, or 85/100" />
                        {formik.touched.grade && formik.errors.grade && <p className="text-red-500 text-xs mt-1">{formik.errors.grade}</p>}
                    </div>
                     <div>
                        <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">Feedback (Optional)</label>
                        <textarea id="feedback" name="feedback" {...formik.getFieldProps('feedback')} rows="4" className="mt-1 w-full p-2 border border-gray-300 rounded-md" placeholder="Provide constructive feedback for the student..."></textarea>
                    </div>
                     <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={formik.isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                            {formik.isSubmitting ? 'Saving...' : 'Save Grade'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function ViewSubmissionsPage() {
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
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

    const handleOpenModal = (submission) => {
        setSelectedSubmission(submission);
        setIsModalOpen(true);
    };

    const handleGradeSaved = (updatedSubmission) => {
        // Update the submission in the local state to instantly reflect the change
        setSubmissions(submissions.map(s => s._id === updatedSubmission._id ? updatedSubmission : s));
    };

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading submissions...</div>;
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <GradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} submission={selectedSubmission} onGradeSaved={handleGradeSaved} />
            
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
                                <td className="px-3 py-4 text-sm">
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                        sub.status === 'Graded' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'
                                    }`}>{sub.status}</span>
                                </td>
                                <td className="px-3 py-4 text-sm font-medium text-gray-900">{sub.grade || 'Not Graded'}</td>
                                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <button onClick={() => handleOpenModal(sub)} className="text-blue-600 hover:text-blue-900 font-semibold">
                                        {sub.status === 'Graded' ? 'Update Grade' : 'Grade'}
                                    </button>
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
