'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Eye, Edit, Trash2, Plus, MoreVertical, Search, AlertTriangle, Video, BookOpen, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Reusable Confirmation Modal Component for safe deletion
const ConfirmationModal = ({ isOpen, onClose, onConfirm, courseTitle }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Course</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete "<strong>{courseTitle}</strong>"? This action is permanent and cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm" onClick={onConfirm}>Delete</button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default function ManageCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data } = await axiosInstance.get('/courses');
                setCourses(data);
            } catch (error) {
                toast.error('Could not fetch your courses.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);
    
    const openDeleteModal = (course) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedCourse(null);
        setIsModalOpen(false);
    };

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        const toastId = toast.loading('Deleting course...');
        try {
            await axiosInstance.delete(`/courses/${selectedCourse._id}`);
            setCourses(courses.filter(c => c._id !== selectedCourse._id));
            toast.success('Course deleted successfully!', { id: toastId });
        } catch (error) {
            toast.error('Failed to delete course.', { id: toastId });
        } finally {
            closeDeleteModal();
        }
    };
    
    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading your courses...</div>;
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <ConfirmationModal 
                isOpen={isModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteCourse}
                courseTitle={selectedCourse?.title}
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
                    <p className="text-sm text-gray-500 mt-1">Here you can view, edit, and manage all your courses.</p>
                </div>
                <div className="w-full md:w-auto flex items-center gap-x-4">
                     <div className="relative flex-grow md:flex-grow-0">
                        <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                        <input type="text" placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                    </div>
                </div>
            </div>

            {filteredCourses.length > 0 ? (
                 <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Course</th>
                                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Details</th>
                                <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">Status</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredCourses.map(course => {
                                const totalLessons = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);
                                return (
                                <tr key={course._id} className="hover:bg-gray-50">
                                    <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm sm:w-auto sm:max-w-none sm:pl-6">
                                        <div className="flex items-center gap-4">
                                            <img src={course.thumbnail.url || 'https://placehold.co/112x64/e0e7ff/3730a3?text=No-Image'} alt={course.title} className="h-16 w-28 rounded-md object-cover"/>
                                            <div>
                                                <div className="font-medium text-gray-900">{course.title}</div>
                                                <div className="text-gray-500">{new Date(course.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">
                                        <div className="flex flex-col gap-1">
                                             <span className="flex items-center gap-1.5"><DollarSign size={14} /> Price: ${course.price}</span>
                                             <span className="flex items-center gap-1.5"><BookOpen size={14} /> Sections: {course.curriculum.length}</span>
                                             <span className="flex items-center gap-1.5"><Video size={14} /> Lessons: {totalLessons}</span>
                                        </div>
                                    </td>
                                    <td className="hidden px-3 py-4 text-sm text-gray-500 sm:table-cell">
                                         <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                             course.status === 'Published' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                         }`}>
                                            {course.status}
                                        </span>
                                    </td>
                                    <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                       <div className="relative flex items-center justify-end gap-2">
                                            <button className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" title="View Course"><Eye size={18} /></button>
                                            <button className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100" title="Edit Course"><Edit size={18} /></button>
                                            <button onClick={() => openDeleteModal(course)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50" title="Delete Course"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Courses Found</h3>
                    <p className="mt-1 text-sm text-gray-500">You haven't created any courses yet. Get started by creating one!</p>
                    <div className="mt-6">
                        <Link href="/company/create-course"
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                                Create First Course
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
