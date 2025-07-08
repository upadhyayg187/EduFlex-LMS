'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Users, Search, ChevronUp, ChevronDown, AlertTriangle, Trash2, BookCopy } from 'lucide-react';
import { format } from 'date-fns';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, studentName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
                <div className="text-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Student</h3>
                        <p className="mt-2 text-sm text-gray-500">Are you sure you want to delete "<strong>{studentName}</strong>"? This will permanently delete the student and all of their associated data (progress, submissions, etc.). This action cannot be undone.</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700" onClick={onConfirm}>Delete Student</button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default function ManageStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get('/admins/students');
            setStudents(data);
        } catch (error) {
            toast.error('Could not fetch students.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const openDeleteModal = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedStudent(null);
        setIsModalOpen(false);
    };

    const handleDeleteStudent = async () => {
        if (!selectedStudent) return;
        const toastId = toast.loading('Deleting student...');
        try {
            await axiosInstance.delete(`/admins/students/${selectedStudent._id}`);
            toast.success(`Student '${selectedStudent.name}' deleted!`, { id: toastId });
            fetchStudents(); // Refetch the list
        } catch (error) {
            toast.error('Failed to delete student.', { id: toastId });
        } finally {
            closeDeleteModal();
        }
    };

    const sortedAndFilteredStudents = useMemo(() => {
        let sortableStudents = [...students];
        if (searchTerm) {
            sortableStudents = sortableStudents.filter(s =>
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (sortConfig.key !== null) {
            sortableStudents.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableStudents;
    }, [students, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
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
    
    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading students...</div>;
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <ConfirmationModal isOpen={isModalOpen} onClose={closeDeleteModal} onConfirm={handleDeleteStudent} studentName={selectedStudent?.name} />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Students</h1>
                    <p className="text-sm text-gray-500 mt-1">Oversee all registered students on the platform.</p>
                </div>
                <div className="relative">
                    <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                    <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full md:w-72 rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"/>
                </div>
            </div>

            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader label="Student" sortKey="name" />
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Courses Enrolled</th>
                                <SortableHeader label="Date Joined" sortKey="createdAt" />
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {sortedAndFilteredStudents.map(student => (
                            <tr key={student._id}>
                                <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">{getInitials(student.name)}</div>
                                        <div>
                                            <div className="font-medium text-gray-900">{student.name}</div>
                                            <div className="text-gray-500">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5"><BookCopy size={14} /> {student.enrolledCourseCount} Courses</span>
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-500">{format(new Date(student.createdAt), 'PP')}</td>
                                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <button onClick={() => openDeleteModal(student)} className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1">
                                        <Trash2 size={16} /> Delete
                                    </button>
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