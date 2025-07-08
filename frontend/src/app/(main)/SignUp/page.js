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
import { User, Building, Mail, Lock } from 'lucide-react';

export default function SignupPage() {
  const [role, setRole] = useState('student');
  const router = useRouter();

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '' },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      const loadingToast = toast.loading('Creating account...');
      try {
        // --- FIX: Use the single, centralized signup endpoint for both roles ---
        await axiosInstance.post('/auth/signup', { ...values, role });
        
        toast.dismiss(loadingToast);
        toast.success('Signup successful! Please login.');
        resetForm();
        router.push(`/login?role=${role}`);
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(error.response?.data?.message || 'Signup failed');
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
            <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
            <p className="text-gray-500 mt-2">Join our community to start your learning journey.</p>
        </div>

        <div className="flex justify-center mb-6 rounded-lg p-1 bg-gray-100">
          <button
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${role === 'student' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}
            onClick={() => setRole('student')}
          >
            <User size={16} /> I am a Student
          </button>
          <button
            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2 ${role === 'company' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600'}`}
            onClick={() => setRole('company')}
          >
            <Building size={16} /> I am a Company
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
            <Input
              id="name"
              name="name"
              placeholder="Full Name"
              icon={User}
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name}
            />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email Address"
              icon={Mail}
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
              icon={Lock}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
            />
          <Button type="submit" disabled={formik.isSubmitting} fullWidth>
            {formik.isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                Log In
            </Link>
        </p>
      </div>
    </div>
  );
}
