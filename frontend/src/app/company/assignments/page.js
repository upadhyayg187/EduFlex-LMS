'use client';

import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { ClipboardList, Plus, Search, Edit, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Combined Modal for Creating and Editing Assignments
const AssignmentModal = ({ isOpen, onClose, courses, onAssignmentSaved, assignmentData }) => {
    const isEditMode = !!assignmentData;

    const formik = useFormik({
        initialValues: {
            title: assignmentData?.title || '',
            description: assignmentData?.description || '',
            courseId: assignmentData?.course?._id || '',
            dueDate: assignmentData?.dueDate ? new Date(assignmentData.dueDate).toISOString().split('T')[0] : '',
        },
        validationSchema: Yup.object({
            title: Yup.string().required('Title is required.'),
            courseId: Yup.string().required('Please select a course.'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const toastId = toast.loading(isEditMode ? 'Updating assignment...' : 'Creating assignment...');
            const method = isEditMode ? 'put' : 'post';
            const url = isEditMode ? `/assignments/${assignmentData._id}` : '/assignments';
            
            try {
                const { data } = await axiosInstance[method](url, values);
                onAssignmentSaved(data);
                toast.success(`Assignment ${isEditMode ? 'updated' : 'created'}!`, { id: toastId });
                resetForm();
                onClose();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Operation failed.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
        enableReinitialize: true,
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl w-full max-w-lg animate-in fade-in-0 zoom-in-95">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? 'Edit Assignment' : 'Create New Assignment'}</h2>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="courseId" className="block text-sm font-medium text-gray-700">Course *</label>
                        <select id="courseId" {...formik.getFieldProps('courseId')} disabled={isEditMode} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed">
                            {isEditMode ? <option value={assignmentData.course._id}>{assignmentData.course.title}</option> : <option value="">Select a published course</option>}
                            {!isEditMode && courses.map(course => (<option key={course._id} value={course._id}>{course.title}</option>))}
                        </select>
                        {formik.touched.courseId && formik.errors.courseId ? <p className="text-red-500 text-xs mt-1">{formik.errors.courseId}</p> : null}
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Assignment Title *</label>
                        <input type="text" id="title" {...formik.getFieldProps('title')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-50" />
                        {formik.touched.title && formik.errors.title ? <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p> : null}
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea id="description" {...formik.getFieldProps('description')} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-50" />
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                        <input type="date" id="dueDate" {...formik.getFieldProps('dueDate')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-50" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={formik.isSubmitting} className="py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
                            {formik.isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Assignment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md animate-in fade-in-0 zoom-in-95">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-600"/></div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Assignment</h3>
                        <div className="mt-2"><p className="text-sm text-gray-500">Are you sure you want to delete &quot;<strong>{title}</strong>&quot;? This action is permanent.</p></div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm" onClick={onConfirm}>Delete</button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assignmentsRes, coursesRes] = await Promise.all([
                    axiosInstance.get('/assignments'),
                    axiosInstance.get('/courses')
                ]);
                setAssignments(assignmentsRes.data);
                setCourses(coursesRes.data.filter(c => c.status === 'Published'));
            } catch (error) {
                toast.error('Could not fetch necessary data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const handleAssignmentSaved = (savedAssignment) => {
        const exists = assignments.some(a => a._id === savedAssignment._id);
        if (exists) {
            setAssignments(assignments.map(a => a._id === savedAssignment._id ? savedAssignment : a));
        } else {
            setAssignments([savedAssignment, ...assignments]);
        }
    };
    
    const openDeleteModal = (assignment) => { setSelectedAssignment(assignment); setIsDeleteModalOpen(true); };
    const closeDeleteModal = () => { setSelectedAssignment(null); setIsDeleteModalOpen(false); };
    const handleDeleteAssignment = async () => {
        if (!selectedAssignment) return;
        const toastId = toast.loading('Deleting assignment...');
        try {
            await axiosInstance.delete(`/assignments/${selectedAssignment._id}`);
            setAssignments(assignments.filter(a => a._id !== selectedAssignment._id));
            toast.success('Assignment deleted!', { id: toastId });
        } catch (error) {
            toast.error('Failed to delete assignment.', { id: toastId });
        } finally {
            closeDeleteModal();
        }
    };
    
    const openEditModal = (assignment) => {
        setSelectedAssignment(assignment);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedAssignment(null); // Ensure no old data is kept
        setIsModalOpen(true);
    };

    const filteredAssignments = assignments.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="text-center p-10 font-semibold text-gray-500">Loading assignments...</div>;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <AssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} courses={courses} onAssignmentSaved={handleAssignmentSaved} assignmentData={selectedAssignment} />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} onConfirm={handleDeleteAssignment} title={selectedAssignment?.title} />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                    <p className="text-sm text-gray-500 mt-1">Create and manage assignments for your courses.</p>
                </div>
                <div className="w-full md:w-auto flex items-center gap-x-4">
                     <div className="relative flex-grow md:flex-grow-0">
                        <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                        <input type="text" placeholder="Search assignments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"/>
                    </div>
                    <button onClick={openCreateModal} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors whitespace-nowrap">
                        <Plus size={18} />
                        <span className="hidden sm:inline">New Assignment</span>
                    </button>
                </div>
            </div>

            {filteredAssignments.length > 0 ? (
                 <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Assignment Title</th>
                                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Course</th>
                                <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Submissions</th>
                                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">Due Date</th>
                                <th scope="col" className="py-3.5 pl-3 pr-4 text-center text-sm font-semibold text-gray-900 sm:pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredAssignments.map(assignment => (
                                <tr key={assignment._id} className="hover:bg-gray-50">
                                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{assignment.title}</td>
                                    <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">{assignment.course?.title || 'N/A'}</td>
                                    <td className="px-3 py-4 text-sm text-center">
                                        <Link href={`/company/assignments/${assignment._id}/submissions`} className="text-blue-600 hover:underline font-medium">View ({assignment.submissionCount || 0})</Link>
                                    </td>
                                    <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}</td>
                                    <td className="py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6">
                                       <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => openEditModal(assignment)} className="text-gray-400 hover:text-blue-600" title="Edit Assignment"><Edit size={16} /></button>
                                            <button onClick={() => openDeleteModal(assignment)} className="text-gray-400 hover:text-red-600" title="Delete Assignment"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Assignments Created</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first assignment for a course.</p>
                    <div className="mt-6">
                        <button onClick={openCreateModal} type="button" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                            Create Assignment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
