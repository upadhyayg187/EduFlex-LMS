'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { ClipboardList, AlertCircle, UploadCloud, File, X, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';

// Submission Modal Component
const SubmissionModal = ({ isOpen, onClose, assignment, onSubmissionSuccess }) => {
    const formik = useFormik({
        initialValues: {
            submissionFile: null,
        },
        validationSchema: Yup.object({
            submissionFile: Yup.mixed().required('A file is required for submission.'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const toastId = toast.loading('Submitting assignment...');
            const formData = new FormData();
            formData.append('assignmentId', assignment._id);
            formData.append('submissionFile', values.submissionFile);

            try {
                await axiosInstance.post('/submissions', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Assignment submitted successfully!', { id: toastId });
                onSubmissionSuccess(assignment._id);
                resetForm();
                onClose();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Submission failed.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Submit Assignment</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                <div className="mt-4">
                    <p className="font-bold">{assignment.title}</p>
                    <p className="text-sm text-gray-500">{assignment.course.title}</p>
                </div>
                <form onSubmit={formik.handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="submissionFile" className="block text-sm font-medium text-gray-700 mb-2">Upload your file</label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-300" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                    <label htmlFor="submissionFile" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none hover:text-blue-500">
                                        <span>Upload a file</span>
                                        <input id="submissionFile" name="submissionFile" type="file" className="sr-only" onChange={(e) => formik.setFieldValue('submissionFile', e.currentTarget.files[0])} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                {formik.values.submissionFile && <p className="text-xs leading-5 text-gray-600 mt-2">{formik.values.submissionFile.name}</p>}
                            </div>
                        </div>
                        {formik.touched.submissionFile && formik.errors.submissionFile && <p className="text-red-500 text-xs mt-1">{formik.errors.submissionFile}</p>}
                    </div>
                     <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={formik.isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                            {formik.isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('To Do');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const fetchAssignments = async () => {
        try {
            const { data } = await axiosInstance.get('/students/my-assignments');
            setAssignments(data);
        } catch (err) {
            setError('Could not load your assignments.');
            toast.error('Could not load assignments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const handleSubmissionSuccess = (assignmentId) => {
        fetchAssignments();
    };

    const filteredAssignments = useMemo(() => {
        if (activeTab === 'To Do') {
            return assignments.filter(a => a.status === 'To Do');
        }
        return assignments.filter(a => a.status !== 'To Do');
    }, [assignments, activeTab]);

    const openSubmitModal = (assignment) => {
        setSelectedAssignment(assignment);
        setIsModalOpen(true);
    };

    const statusStyles = {
        'To Do': { icon: Clock, color: 'text-gray-500' },
        'Submitted': { icon: CheckCircle, color: 'text-blue-500' },
        'Graded': { icon: CheckCircle, color: 'text-green-600' },
    };
    
    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <SubmissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} assignment={selectedAssignment} onSubmissionSuccess={handleSubmissionSuccess} />

            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
                <p className="text-sm text-gray-500 mt-1">View and submit your course assignments here.</p>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('To Do')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'To Do' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>To Do</button>
                    <button onClick={() => setActiveTab('Completed')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Completed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Completed</button>
                </nav>
            </div>

            {loading ? (
                <p className="text-center p-10">Loading assignments...</p>
            ) : error ? (
                <div className="text-center p-10 bg-red-50 text-red-700 rounded-lg"><AlertCircle className="mx-auto h-8 w-8" /><p className="mt-2">{error}</p></div>
            ) : filteredAssignments.length > 0 ? (
                <div className="space-y-4">
                    {filteredAssignments.map(assignment => {
                        const StatusIcon = statusStyles[assignment.status]?.icon || Clock;
                        const statusColor = statusStyles[assignment.status]?.color || 'text-gray-500';
                        return (
                            <div key={assignment._id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full bg-gray-100 ${statusColor}`}><ClipboardList size={20} /></div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{assignment.title}</p>
                                        <p className="text-xs text-gray-500">{assignment.course.title} • Due: {assignment.dueDate ? format(new Date(assignment.dueDate), 'PP') : 'No due date'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm font-medium flex items-center gap-1.5 ${statusColor}`}>
                                        <StatusIcon size={16} /> {assignment.status}
                                    </span>
                                    {assignment.status === 'To Do' && (
                                        <button onClick={() => openSubmitModal(assignment)} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Submit</button>
                                    )}
                                    {assignment.status === 'Submitted' && (
                                        <a href={assignment.submission.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">View Submission</a>
                                    )}
                                     {assignment.status === 'Graded' && (
                                        <a href={assignment.submission.fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-sm font-semibold text-green-700 bg-green-100 rounded-md hover:bg-green-200">View Graded</a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                 <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                    {/* --- FIX: Use the imported ClipboardList icon --- */}
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">All Caught Up!</h3>
                    <p className="mt-1 text-sm text-gray-500">You have no {activeTab === 'To Do' ? 'pending' : 'completed'} assignments.</p>
                </div>
            )}
        </div>
    );
}
