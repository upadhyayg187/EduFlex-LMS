'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { BookCopy, Search, ChevronUp, ChevronDown, AlertTriangle, Trash2, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, courseTitle }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
                <div className="text-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                    <div className="mt-3">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Course</h3>
                        <p className="mt-2 text-sm text-gray-500">Are you sure you want to delete &quot;<strong>{courseTitle}</strong>&quot;? This will permanently delete the course and all related student data. This action cannot be undone.</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700" onClick={onConfirm}>Delete Course</button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Published: 'bg-green-100 text-green-800 ring-green-600/20',
        Draft: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    };
    return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

export default function ManageCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get('/admins/courses');
            setCourses(data);
        } catch (error) {
            toast.error('Could not fetch courses.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const openDeleteModal = (course) => { setSelectedCourse(course); setIsModalOpen(true); };
    const closeDeleteModal = () => setIsModalOpen(false);

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        const toastId = toast.loading('Deleting course...');
        try {
            await axiosInstance.delete(`/admins/courses/${selectedCourse._id}`);
            toast.success(`Course '${selectedCourse.title}' deleted!`, { id: toastId });
            fetchCourses();
        } catch (error) {
            toast.error('Failed to delete course.', { id: toastId });
        } finally {
            closeDeleteModal();
        }
    };

    const sortedAndFilteredCourses = useMemo(() => {
        let sortableCourses = [...courses];
        if (searchTerm) {
            sortableCourses = sortableCourses.filter(c =>
                c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (sortConfig.key !== null) {
            sortableCourses.sort((a, b) => {
                const aValue = sortConfig.key === 'createdBy' ? a.createdBy.name : a[sortConfig.key];
                const bValue = sortConfig.key === 'createdBy' ? b.createdBy.name : b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableCourses;
    }, [courses, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') { direction = 'descending'; }
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey }) => {
        const isSorted = sortConfig.key === sortKey;
        const Icon = isSorted ? (sortConfig.direction === 'ascending' ? ChevronUp : ChevronDown) : null;
        return (
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer" onClick={() => requestSort(sortKey)}>
                <div className="flex items-center gap-1">{label} {Icon && <Icon size={16} />}</div>
            </th>
        );
    };

    if (loading) return <div className="text-center p-10 font-semibold text-gray-500">Loading courses...</div>;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <ConfirmationModal isOpen={isModalOpen} onClose={closeDeleteModal} onConfirm={handleDeleteCourse} courseTitle={selectedCourse?.title} />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Courses</h1>
                    <p className="text-sm text-gray-500 mt-1">Oversee all courses on the platform.</p>
                </div>
                <div className="relative">
                    <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                    <input type="text" placeholder="Search courses or companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full md:w-72 rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"/>
                </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader label="Course Title" sortKey="title" />
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created By</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stats</th>
                                <SortableHeader label="Status" sortKey="status" />
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {sortedAndFilteredCourses.map(course => (
                            <tr key={course._id}>
                                <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="flex items-center gap-4">
                                        <img src={course.thumbnail?.url || 'https://placehold.co/112x64/e0e7ff/3730a3?text=No-Image'} alt={course.title} className="h-12 w-20 rounded-md object-cover"/>
                                        <div className="font-medium text-gray-900">{course.title}</div>
                                    </div>
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-500">{course.createdBy?.name || 'N/A'}</td>
                                <td className="px-3 py-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5"><Users size={14} /> {course.students?.length || 0} Students</span>
                                </td>
                                <td className="px-3 py-4 text-sm"><StatusBadge status={course.status} /></td>
                                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/courses/${course._id}`} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600" title="View Course"><Eye size={16}/></Link>
                                        <button onClick={() => openDeleteModal(course)} className="p-1 text-red-500 hover:text-red-700" title="Delete Course"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
