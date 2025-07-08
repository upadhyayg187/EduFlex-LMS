'use client';

import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, Toaster } from 'react-hot-toast';
import axiosInstance from '@/helpers/axiosInstance';
import { Settings, Image as ImageIcon, Shield } from 'lucide-react';

const SettingsTab = ({ id, activeTab, setActiveTab, icon: Icon, label }) => (
    <button type="button" onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Icon className="h-5 w-5" />
        <span className="font-semibold text-sm">{label}</span>
    </button>
);

const SectionWrapper = ({ title, description, children }) => (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">{description}</p>
        <div className="pt-6 border-t border-gray-200 space-y-6">
            {children}
        </div>
    </div>
);

const GeneralSettings = () => {
    const [logoPreview, setLogoPreview] = useState('');

    const formik = useFormik({
        initialValues: { platformName: '', logo: null },
        validationSchema: Yup.object({ platformName: Yup.string().required('Platform name is required') }),
        onSubmit: async (values, { setSubmitting }) => {
            const formData = new FormData();
            formData.append('platformName', values.platformName);
            if (values.logo) {
                formData.append('logo', values.logo);
            }
            const toastId = toast.loading('Saving settings...');
            try {
                await axiosInstance.put('/admins/settings', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Settings saved successfully!', { id: toastId });
            } catch (error) {
                toast.error('Failed to save settings.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axiosInstance.get('/admins/settings');
                formik.setFieldValue('platformName', data.platformName);
                if (data.logo?.url) {
                    setLogoPreview(data.logo.url);
                }
            } catch (error) {
                toast.error('Could not fetch platform settings.');
            }
        };
        fetchSettings();
    }, []);

    return (
        <form onSubmit={formik.handleSubmit}>
            <SectionWrapper title="General Settings" description="Manage your platform's basic information.">
                <div>
                    <label htmlFor="platformName" className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                    <input id="platformName" type="text" {...formik.getFieldProps('platformName')} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform Logo</label>
                    <div className="mt-2 flex items-center gap-x-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            {logoPreview ? <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" /> : <ImageIcon className="h-8 w-8 text-gray-400"/>}
                        </div>
                        <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                            <span>Change</span>
                            <input id="logo-upload" name="logo" type="file" className="sr-only" onChange={(e) => {
                                const file = e.currentTarget.files[0];
                                formik.setFieldValue('logo', file);
                                setLogoPreview(URL.createObjectURL(file));
                            }}/>
                        </label>
                    </div>
                </div>
                 <div className="flex justify-end mt-2">
                    <button type="submit" disabled={formik.isSubmitting || !formik.dirty} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </SectionWrapper>
        </form>
    );
};

const SecuritySettings = () => {
    const [showPasswords, setShowPasswords] = useState(false);
    const formik = useFormik({
        initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
        validationSchema: Yup.object({
            currentPassword: Yup.string().required('Current password is required'),
            newPassword: Yup.string().required('New password is required').min(6, 'Password must be at least 6 characters long'),
            confirmPassword: Yup.string().required('Please confirm your new password').oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const toastId = toast.loading('Updating password...');
            try {
                await axiosInstance.put('/admins/change-password', {
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                });
                toast.success('Password updated successfully!', { id: toastId });
                resetForm();
            } catch (error) {
                 toast.error(error.response?.data?.message || 'Failed to update password.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <form onSubmit={formik.handleSubmit}>
            <SectionWrapper title="Admin Security" description="Update your administrator password.">
                <div>
                    <label htmlFor="currentPassword">Current Password</label>
                    <input id="currentPassword" name="currentPassword" type={showPasswords ? 'text' : 'password'} {...formik.getFieldProps('currentPassword')} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {formik.touched.currentPassword && formik.errors.currentPassword && <p className="text-red-500 text-xs mt-1">{formik.errors.currentPassword}</p>}
                </div>
                <div>
                    <label htmlFor="newPassword">New Password</label>
                    <input id="newPassword" name="newPassword" type={showPasswords ? 'text' : 'password'} {...formik.getFieldProps('newPassword')} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {formik.touched.newPassword && formik.errors.newPassword && <p className="text-red-500 text-xs mt-1">{formik.errors.newPassword}</p>}
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input id="confirmPassword" name="confirmPassword" type={showPasswords ? 'text' : 'password'} {...formik.getFieldProps('confirmPassword')} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formik.errors.confirmPassword}</p>}
                </div>
                <div className="flex items-center mt-4">
                    <input id="show-password" type="checkbox" checked={showPasswords} onChange={(e) => setShowPasswords(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900">Show passwords</label>
                </div>
                <div className="flex justify-end mt-2">
                    <button type="submit" disabled={formik.isSubmitting || !formik.isValid || !formik.dirty} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {formik.isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </SectionWrapper>
        </form>
    );
};

export default function PlatformSettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-gray-500 mt-1">Configure and manage your LMS platform.</p>
            </div>
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <aside className="lg:col-span-3">
                    <nav className="space-y-1.5">
                        <SettingsTab id="general" activeTab={activeTab} setActiveTab={setActiveTab} icon={Settings} label="General" />
                        <SettingsTab id="security" activeTab={activeTab} setActiveTab={setActiveTab} icon={Shield} label="Security" />
                    </nav>
                </aside>
                <main className="lg:col-span-9 mt-8 lg:mt-0">
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                </main>
            </div>
        </div>
    );
}
