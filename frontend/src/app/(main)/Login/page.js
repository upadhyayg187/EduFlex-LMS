'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast, { Toaster } from 'react-hot-toast';
import axiosInstance from '@/helpers/axiosInstance';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { IconMail, IconLock } from '@tabler/icons-react';

export default function LoginPage() {
  const [role, setRole] = useState('student');
  const router = useRouter();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const loadingToast = toast.loading('Logging in...');
      try {
        const { data } = await axiosInstance.post('/auth/login', { ...values, role });
        toast.dismiss(loadingToast);
        toast.success('Login successful!');
        resetForm();

        // --- THE FIX IS HERE ---
        // 1. Save the full user object (you were already doing this)
        localStorage.setItem('eduflex-user', JSON.stringify(data));

        // 2. ALSO save just the token under the correct key (this is the new line)
        localStorage.setItem('userToken', data.token);
        // --- END OF FIX ---


        // Redirect based on role
        if (data.role === 'admin') router.push('/admin/dashboard');
        else if (data.role === 'company') router.push('/company/dashboard');
        else router.push('/student/dashboard');

      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(error.response?.data?.message || 'Login failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-500 mt-2">Log in to continue to your dashboard.</p>
        </div>

        <div className="flex justify-center mb-6 rounded-lg p-1 bg-gray-100">
          <button
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${role === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${role === 'company' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}
            onClick={() => setRole('company')}
          >
            Company
          </button>
          <button
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${role === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Email Address"
            icon={IconMail}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email}
          />
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            icon={IconLock}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && formik.errors.password}
          />
          <Button type="submit" disabled={formik.isSubmitting} fullWidth>
            {formik.isSubmitting ? 'Logging In...' : 'Login'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account?{' '}
          <Link href="/SignUp" className="font-semibold text-blue-600 hover:text-blue-500">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
