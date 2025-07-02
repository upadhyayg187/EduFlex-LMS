'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, Toaster } from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import axiosInstance from '@/helpers/axiosInstance';
import { User, ShieldCheck, CreditCard, Camera, Trash2 } from 'lucide-react';

// Settings Tab Reusable Component
const SettingsTab = ({ id, activeTab, setActiveTab, icon: Icon, label }) => (
    <button type="button" onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors duration-200 ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Icon className="h-5 w-5" />
        <span className="font-semibold text-sm">{label}</span>
    </button>
);

// Section Wrapper Reusable Component
const SectionWrapper = ({ title, description, children }) => (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 mb-6">{description}</p>
        <div className="pt-6 border-t border-gray-200 space-y-6">
            {children}
        </div>
    </div>
);

// Profile Settings Component
const ProfileSettings = () => {
    const { user, updateUser } = useUser();
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');

    const formik = useFormik({
        initialValues: {
            name: user?.name || '',
            industry: user?.industry || '',
            avatar: null,
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Company name is required'),
            industry: Yup.string(),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            const formData = new FormData();
            formData.append('name', values.name);
            formData.append('industry', values.industry);
            if (values.avatar) {
                formData.append('avatar', values.avatar);
            }

            const toastId = toast.loading('Updating profile...');
            try {
                const { data } = await axiosInstance.put('/companies/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                updateUser(data);
                toast.success('Profile updated successfully!', { id: toastId });
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to update profile.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
        enableReinitialize: true,
    });

    const handleRemoveLogo = async () => {
        const toastId = toast.loading('Removing logo...');
        try {
            const { data } = await axiosInstance.delete('/companies/profile/avatar');
            updateUser(data);
            setAvatarPreview('');
            toast.success('Logo removed successfully!', { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove logo.', { id: toastId });
        }
    };
    
    const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : '');

    return (
        <form onSubmit={formik.handleSubmit}>
            <SectionWrapper title="Company Profile" description="Update your company's public information.">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Company Logo" className="h-20 w-20 rounded-full object-cover" />
                        ) : (
                            <div className="h-20 w-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold">
                                {getInitials(formik.values.name)}
                            </div>
                        )}
                        <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border cursor-pointer hover:bg-gray-100">
                            <Camera className="w-4 h-4 text-gray-600"/>
                            <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.currentTarget.files[0];
                                if (file) {
                                    formik.setFieldValue('avatar', file);
                                    setAvatarPreview(URL.createObjectURL(file));
                                }
                            }} />
                        </label>
                    </div>
                    <div className="flex items-center gap-3">
                         {avatarPreview && (
                            <button type="button" onClick={handleRemoveLogo} className="flex items-center gap-1.5 text-sm text-red-600 font-semibold hover:text-red-800">
                                <Trash2 size={16} /> Remove
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input id="name" type="text" {...formik.getFieldProps('name')} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        {formik.touched.name && formik.errors.name && <p className="text-red-500 text-xs mt-1">{formik.errors.name}</p>}
                    </div>
                     <div>
                        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <input id="industry" type="text" {...formik.getFieldProps('industry')} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input id="email" type="email" value={user?.email || ''} disabled className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                        <p className="text-xs text-gray-500 mt-1">To update email, please contact support.</p>
                    </div>
                </div>
                 <div className="flex justify-end mt-8">
                    <button type="submit" disabled={formik.isSubmitting || !formik.dirty} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </SectionWrapper>
        </form>
    );
};

// --- REBUILT Security Settings Component ---
const SecuritySettings = () => {
    const [showPasswords, setShowPasswords] = useState(false);

    const formik = useFormik({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            currentPassword: Yup.string().required('Current password is required'),
            newPassword: Yup.string()
                .required('New password is required')
                .min(6, 'Password must be at least 6 characters long')
                .notOneOf([Yup.ref('currentPassword'), null], 'New password must be different from the current one'),
            confirmPassword: Yup.string()
                .required('Please confirm your new password')
                .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const toastId = toast.loading('Updating password...');
            try {
                await axiosInstance.put('/companies/change-password', {
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
            <SectionWrapper title="Password & Security" description="Update your password for enhanced account security.">
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords ? 'text' : 'password'}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        {...formik.getFieldProps('currentPassword')}
                    />
                    {formik.touched.currentPassword && formik.errors.currentPassword && <p className="text-red-500 text-xs mt-1">{formik.errors.currentPassword}</p>}
                </div>
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords ? 'text' : 'password'}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        {...formik.getFieldProps('newPassword')}
                    />
                    {formik.touched.newPassword && formik.errors.newPassword && <p className="text-red-500 text-xs mt-1">{formik.errors.newPassword}</p>}
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords ? 'text' : 'password'}
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        {...formik.getFieldProps('confirmPassword')}
                    />
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{formik.errors.confirmPassword}</p>}
                </div>
                
                <div className="flex items-center mt-4">
                    <input
                        id="show-password"
                        type="checkbox"
                        checked={showPasswords}
                        onChange={(e) => setShowPasswords(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="show-password" className="ml-2 block text-sm text-gray-900">Show passwords</label>
                </div>

                 <div className="flex justify-end mt-8">
                    <button type="submit" disabled={formik.isSubmitting || !formik.isValid || !formik.dirty} className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {formik.isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </SectionWrapper>
        </form>
    );
};

// Billing Settings Component
const BillingSettings = () => (
    <SectionWrapper title="Billing & Subscriptions" description="Manage your payment methods and subscriptions.">
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <h4 className="text-lg font-medium text-gray-800">Billing features are coming soon.</h4>
            <p className="text-sm text-gray-500">This section is currently under development.</p>
        </div>
    </SectionWrapper>
);

// Main Settings Page Component
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile');
    const { loading } = useUser();

    if (loading) {
        return <div className="text-center p-10 font-semibold">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
                <p className="text-gray-500 mt-1">Manage your company profile, security, and billing.</p>
            </div>
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                <aside className="lg:col-span-3">
                    <nav className="space-y-1.5">
                        <SettingsTab id="profile" activeTab={activeTab} setActiveTab={setActiveTab} icon={User} label="Company Profile" />
                        <SettingsTab id="security" activeTab={activeTab} setActiveTab={setActiveTab} icon={ShieldCheck} label="Password & Security" />
                        <SettingsTab id="billing" activeTab={activeTab} setActiveTab={setActiveTab} icon={CreditCard} label="Billing & Subscriptions" />
                    </nav>
                </aside>
                <main className="lg:col-span-9 mt-8 lg:mt-0">
                    {activeTab === 'profile' && <ProfileSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                    {activeTab === 'billing' && <BillingSettings />}
                </main>
            </div>
        </div>
    );
}
