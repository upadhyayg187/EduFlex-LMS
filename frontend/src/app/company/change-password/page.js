'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import axiosInstance from '@/helpers/axiosInstance';

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Too short', color: 'bg-red-500' };
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return {
    score,
    label: labels[score - 1] || 'Too short',
    color: colors[score - 1] || 'bg-gray-300',
  };
};

const ChangePasswordPage = () => {
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  const [successMessage, setSuccessMessage] = useState('');

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string().min(6, 'At least 6 characters').required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Please confirm your new password'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await axiosInstance.post('/companies/update-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });

        toast.success(res.data.message);
        setSuccessMessage('Password updated successfully!');
        resetForm();

        // Hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error updating password');
      }
    },
  });

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(formik.values.newPassword));
  }, [formik.values.newPassword]);

  return (
    <div className="p-6 md:p-10">
      <h2 className="text-2xl font-semibold mb-6">Change Password</h2>

      <form
        onSubmit={formik.handleSubmit}
        className="bg-white p-6 shadow-md rounded-lg space-y-5 max-w-md"
        autoComplete="off"
      >
        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="block mb-1 font-medium">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formik.values.currentPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.currentPassword && formik.errors.currentPassword && (
            <p className="text-sm text-red-500 mt-1">{formik.errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block mb-1 font-medium">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.newPassword && formik.errors.newPassword && (
            <p className="text-sm text-red-500 mt-1">{formik.errors.newPassword}</p>
          )}

          {formik.values.newPassword && (
            <div className="mt-2">
              <span className="text-sm">Strength: {passwordStrength.label}</span>
              <div className="w-full h-2 bg-gray-200 rounded mt-1">
                <div
                  className={`h-full rounded ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block mb-1 font-medium">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{formik.errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Update Password
        </button>

        {/* ✅ Success Message */}
        {successMessage && (
          <p className="text-green-600 text-sm text-center mt-2">{successMessage}</p>
        )}
      </form>
    </div>
  );
};

export default ChangePasswordPage;
