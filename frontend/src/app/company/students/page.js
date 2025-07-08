'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Users, Search, ChevronUp, ChevronDown, AlertTriangle, Trash2, X, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// --- THIS IS THE FIX ---
// Added the missing ConfirmationModal component definition.
const ConfirmationModal = ({ isOpen, onClose, onConfirm, studentName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Remove Student</h3>
                        <div className="mt-2"><p className="text-sm text-gray-500">Are you sure you want to remove "<strong>{studentName}</strong>" from all your courses? This action will unenroll them.</p></div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm" onClick={onConfirm}>Remove Student</button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const ViewCoursesModal = ({ isOpen, onClose, student }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Courses Enrolled by {student.name}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </div>
                <div className="mt-4 max-h-80 overflow-y-auto">
                    {student.enrolledCoursesList && student.enrolledCoursesList.length > 0 ? (
                        <ul className="space-y-2">
                            {student.enrolledCoursesList.map(course => (
                                <li key={course._id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                                    <span className="text-gray-800">{course.title}</span>
                                    <Link href={`/courses/${course._id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                        View <ExternalLink size={14} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">This student is not enrolled in any courses.</p>
                    )}
                </div>
                <div className="mt-5 text-right">
                    <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default function EnrolledStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const studentsPerPage = 10;

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get('/companies/students');
            setStudents(data);
        } catch (error) {
            toast.error('Could not fetch your enrolled students.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const openDeleteModal = (student) => { setSelectedStudent(student); setIsDeleteModalOpen(true); };
    const closeDeleteModal = () => setIsDeleteModalOpen(false);

    const openCoursesModal = (student) => { setSelectedStudent(student); setIsCoursesModalOpen(true); };
    const closeCoursesModal = () => setIsCoursesModalOpen(false);

    const handleRemoveStudent = async () => {
        if (!selectedStudent) return;
        const toastId = toast.loading('Removing student...');
        try {
            await axiosInstance.delete(`/companies/student/${selectedStudent._id}`);
            toast.success('Student removed successfully!', { id: toastId });
            fetchStudents();
        } catch (error) {
            toast.error('Failed to remove student.', { id: toastId });
        } finally {
            closeDeleteModal();
        }
    };

    const sortedAndFilteredStudents = useMemo(() => {
        let sortableStudents = [...students];
        if (searchTerm) {
            sortableStudents = sortableStudents.filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())
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
    
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = sortedAndFilteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
    const totalPages = Math.ceil(sortedAndFilteredStudents.length / studentsPerPage);

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

    if (loading) return <div className="text-center p-10 font-semibold text-gray-500">Loading your student list...</div>;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} onConfirm={handleRemoveStudent} studentName={selectedStudent?.name} />
            <ViewCoursesModal isOpen={isCoursesModalOpen} onClose={closeCoursesModal} student={selectedStudent} />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Enrolled Students</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and view all students enrolled in your courses.</p>
                </div>
                <div className="relative flex-grow md:flex-grow-0">
                    <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                    <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                </div>
            </div>

            {students.length > 0 ? (
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <SortableHeader label="Student" sortKey="name" />
                                    <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Enrolled Courses</th>
                                    <SortableHeader label="Date Joined" sortKey="createdAt" />
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {currentStudents.map(student => (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm sm:w-auto sm:max-w-none sm:pl-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                {getInitials(student.name)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                <div className="text-gray-500">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">
                                        <button onClick={() => openCoursesModal(student)} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                            {student.enrolledCourseCount}
                                        </button>
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                                    <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                       <div className="flex items-center justify-end gap-4">
                                            <Link href={`/company/students/${student._id}`} className="text-blue-600 hover:text-blue-800 font-semibold">View Profile</Link>
                                            <button onClick={() => openDeleteModal(student)} className="text-red-600 hover:text-red-800 font-semibold"><Trash2 size={16}/></button>
                                       </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {totalPages > 1 && (
                        <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6" aria-label="Pagination">
                            <div className="hidden sm:block">
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{indexOfFirstStudent + 1}</span> to <span className="font-medium">{Math.min(indexOfLastStudent, sortedAndFilteredStudents.length)}</span> of{' '}
                                    <span className="font-medium">{sortedAndFilteredStudents.length}</span> results
                                </p>
                            </div>
                            <div className="flex flex-1 justify-between sm:justify-end">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                    Previous
                                </button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                                    className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50">
                                    Next
                                </button>
                            </div>
                        </nav>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No Students Enrolled</h3>
                    <p className="mt-1 text-sm text-gray-500">When students enroll in your courses, they will appear here.</p>
                </div>
            )}
        </div>
    );
}
