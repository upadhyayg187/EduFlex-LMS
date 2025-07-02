'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Users, Search, ChevronUp, ChevronDown, UserPlus } from 'lucide-react';

// Helper to get initials from a name
const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

export default function EnrolledStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 10;

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data } = await axiosInstance.get('/companies/students');
                setStudents(data);
            } catch (error) {
                toast.error('Could not fetch your enrolled students.');
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const sortedAndFilteredStudents = useMemo(() => {
        let sortableStudents = [...students];

        // Filtering logic
        if (searchTerm) {
            sortableStudents = sortableStudents.filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sorting logic
        if (sortConfig.key !== null) {
            sortableStudents.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableStudents;
    }, [students, searchTerm, sortConfig]);
    
    // Pagination logic
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
                <div className="flex items-center gap-1">
                    {label} {Icon && <Icon size={16} />}
                </div>
            </th>
        );
    };

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading your student list...</div>;
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Enrolled Students</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and view all students enrolled in your courses.</p>
                </div>
                <div className="w-full md:w-auto flex items-center gap-x-4">
                     <div className="relative flex-grow md:flex-grow-0">
                        <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3" />
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"/>
                    </div>
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
                                    <td className="hidden px-3 py-4 text-sm text-gray-500 lg:table-cell">{student.enrolledCourseCount}</td>
                                    <td className="px-3 py-4 text-sm text-gray-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                                    <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                       <button className="text-blue-600 hover:text-blue-800 font-semibold">View Profile</button>
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
