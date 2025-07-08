'use client';

import { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Building, Search, ChevronUp, ChevronDown, AlertTriangle, Trash2, Users, BookCopy, Check, X, PauseCircle } from 'lucide-react';
import { format } from 'date-fns';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, companyName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md">
                <div className="text-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
                    <div className="mt-3">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Company</h3>
                        <p className="mt-2 text-sm text-gray-500">Are you sure you want to delete "<strong>{companyName}</strong>"? This will permanently delete the company and all of its content. This action cannot be undone.</p>
                    </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700" onClick={onConfirm}>Delete</button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Active: 'bg-green-100 text-green-800 ring-green-600/20',
        Suspended: 'bg-red-100 text-red-800 ring-red-600/20',
        Pending: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    };
    return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

export default function ManageCompaniesPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get('/admins/companies');
            setCompanies(data);
        } catch (error) {
            toast.error('Could not fetch companies.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCompanies(); }, []);

    const openDeleteModal = (company) => { setSelectedCompany(company); setIsModalOpen(true); };
    const closeDeleteModal = () => setIsModalOpen(false);

    const handleDeleteCompany = async () => {
        if (!selectedCompany) return;
        const toastId = toast.loading('Deleting company...');
        try {
            await axiosInstance.delete(`/admins/companies/${selectedCompany._id}`);
            toast.success(`Company '${selectedCompany.name}' deleted!`, { id: toastId });
            fetchCompanies();
        } catch (error) {
            toast.error('Failed to delete company.', { id: toastId });
        } finally {
            closeDeleteModal();
        }
    };

    const handleStatusChange = async (companyId, newStatus) => {
        const toastId = toast.loading('Updating status...');
        try {
            await axiosInstance.put(`/admins/companies/${companyId}/status`, { status: newStatus });
            toast.success('Status updated successfully!', { id: toastId });
            fetchCompanies();
        } catch (error) {
            toast.error('Failed to update status.', { id: toastId });
        }
    };

    const sortedAndFilteredCompanies = useMemo(() => {
        let sortableCompanies = [...companies];
        if (searchTerm) {
            sortableCompanies = sortableCompanies.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (sortConfig.key !== null) {
            sortableCompanies.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableCompanies;
    }, [companies, searchTerm, sortConfig]);

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
    
    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '?');

    if (loading) return <div className="text-center p-10 font-semibold text-gray-500">Loading companies...</div>;

    return (
        <div className="space-y-6">
            <Toaster position="top-center" />
            <ConfirmationModal isOpen={isModalOpen} onClose={closeDeleteModal} onConfirm={handleDeleteCompany} companyName={selectedCompany?.name} />
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Companies</h1>
                    <p className="text-sm text-gray-500 mt-1">Oversee all registered companies on the platform.</p>
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
                                <SortableHeader label="Company" sortKey="name" />
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stats</th>
                                <SortableHeader label="Status" sortKey="status" />
                                <SortableHeader label="Date Joined" sortKey="createdAt" />
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {sortedAndFilteredCompanies.map(company => (
                            <tr key={company._id}>
                                <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{getInitials(company.name)}</div>
                                        <div>
                                            <div className="font-medium text-gray-900">{company.name}</div>
                                            <div className="text-gray-500">{company.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-500">
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-1.5"><BookCopy size={14} /> {company.courseCount} Courses</span>
                                        <span className="flex items-center gap-1.5"><Users size={14} /> {company.totalStudents} Students</span>
                                    </div>
                                </td>
                                <td className="px-3 py-4 text-sm"><StatusBadge status={company.status} /></td>
                                <td className="px-3 py-4 text-sm text-gray-500">{format(new Date(company.createdAt), 'PP')}</td>
                                <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <div className="flex items-center justify-end gap-4">
                                        {company.status === 'Pending' && <button onClick={() => handleStatusChange(company._id, 'Active')} className="font-semibold text-xs text-green-600 hover:text-green-800 flex items-center gap-1"><Check size={16}/>Approve</button>}
                                        {company.status === 'Active' && <button onClick={() => handleStatusChange(company._id, 'Suspended')} className="font-semibold text-xs text-yellow-600 hover:text-yellow-800 flex items-center gap-1"><PauseCircle size={16}/>Suspend</button>}
                                        {company.status === 'Suspended' && <button onClick={() => handleStatusChange(company._id, 'Active')} className="font-semibold text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"><CheckCircle size={16}/>Reactivate</button>}
                                        <button onClick={() => openDeleteModal(company)} className="text-red-500 hover:text-red-700" title="Delete Company"><Trash2 size={16}/></button>
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