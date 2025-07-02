  'use client';

import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import {
  IconUser,
  IconShield,
  IconCreditCard,
} from '@tabler/icons-react';

// --- Reusable tab component ---
const SettingsTab = ({ id, label, icon: Icon, activeTab, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm font-medium w-full transition-all ${
      activeTab === id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <Icon size={20} />
    {label}
  </button>
);

// --- Reusable section wrapper ---
const SectionWrapper = ({ title, subtitle, children }) => (
  <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    <div className="mt-6 border-t border-gray-200 pt-6">{children}</div>
  </div>
);

// -------------------- Main Page --------------------
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get('/companies/profile');
        setCompanyData(data);
      } catch {
        toast.error('Failed to load company data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Company Profile', icon: IconUser },
    { id: 'security', label: 'Password & Security', icon: IconShield },
    { id: 'billing', label: 'Billing & Subscriptions', icon: IconCreditCard },
  ];

  if (loading) return <div className="p-10 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Sidebar Tabs */}
        <aside className="lg:col-span-3">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <SettingsTab key={tab.id} {...tab} activeTab={activeTab} onClick={setActiveTab} />
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 mt-6 lg:mt-0">
          {activeTab === 'profile' && <ProfileSettings initialData={companyData} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'billing' && <BillingSettings />}
        </main>
      </div>
    </div>
  );
}

// -------------------- Profile Tab --------------------
function ProfileSettings({ initialData }) {
  const [avatarPreview, setAvatarPreview] = useState(initialData?.avatar?.url || '');

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      industry: initialData?.industry || '',
      avatar: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Company name is required.'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      const toastId = toast.loading('Updating profile...');
      const formData = new FormData();

      Object.entries(values).forEach(([key, val]) => {
        if (key !== 'email' && val !== null) {
          formData.append(key, val);
        }
      });

      try {
        await axiosInstance.put('/companies/profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Profile updated!', { id: toastId });
        window.location.reload(); // ensures top bar (Header) also reflects changes
      } catch (err) {
        toast.error(err.response?.data?.message || 'Update failed.', { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
    enableReinitialize: true,
  });

  return (
    <SectionWrapper title="Company Profile" subtitle="Update your company’s public information.">
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={
              avatarPreview ||
              `https://ui-avatars.com/api/?name=${formik.values.name}&background=0D8ABC&color=fff&size=128`
            }
            alt="Company Avatar"
            className="h-16 w-16 rounded-full object-cover"
          />
          <label className="cursor-pointer text-sm text-blue-600 hover:underline">
            Change Logo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                formik.setFieldValue('avatar', file);
                setAvatarPreview(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-sm font-medium">Company Name</label>
            <input
              type="text"
              {...formik.getFieldProps('name')}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              disabled
              {...formik.getFieldProps('email')}
              className="w-full p-2 border border-gray-200 rounded-md bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">To update email, contact Admin.</p>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Industry</label>
            <input
              type="text"
              {...formik.getFieldProps('industry')}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={!formik.dirty || formik.isSubmitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Save Changes
          </button>
        </div>
      </form>
    </SectionWrapper>
  );
}

// -------------------- Security Tab --------------------
function SecuritySettings() {
  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required.'),
      newPassword: Yup.string().min(6, 'Minimum 6 characters').required('New password is required.'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match.')
        .required('Confirm new password.'),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const toastId = toast.loading('Updating password...');
      try {
        await axiosInstance.put('/companies/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        toast.success('Password updated!', { id: toastId });
        resetForm();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update password.', { id: toastId });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <SectionWrapper title="Security Settings" subtitle="Update your password to keep your account secure.">
      <form onSubmit={formik.handleSubmit} className="space-y-6 max-w-xl">
        {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
          <div key={i}>
            <label className="block mb-1 text-sm font-medium">
              {field === 'currentPassword'
                ? 'Current Password'
                : field === 'newPassword'
                ? 'New Password'
                : 'Confirm Password'}
            </label>
            <input
              type="password"
              {...formik.getFieldProps(field)}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
            />
            {formik.touched[field] && formik.errors[field] && (
              <p className="text-red-500 text-xs mt-1">{formik.errors[field]}</p>
            )}
          </div>
        ))}
        <div className="text-right">
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Update Password
          </button>
        </div>
      </form>
    </SectionWrapper>
  );
}

// -------------------- Billing Tab --------------------
function BillingSettings() {
  return (
    <SectionWrapper
      title="Billing & Subscriptions"
      subtitle="This section will include invoices and subscription plans."
    >
      <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500">
        💳 Billing functionality coming soon!
      </div>
    </SectionWrapper>
  );
}
