'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, Toaster } from 'react-hot-toast';
import axiosInstance from '@/helpers/axiosInstance';
import { useUser } from '@/context/UserContext';
import { Mail, Lock, User, Building, Shield } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

// A new component to handle the logic, as hooks like useSearchParams can only be used in Client Components wrapped in a Suspense boundary.
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { updateUser } = useUser();
    const [role, setRole] = useState('student');

    useEffect(() => {
        const roleFromUrl = searchParams.get('role');
        if (['student', 'company', 'admin'].includes(roleFromUrl)) {
            setRole(roleFromUrl);
        }
    }, [searchParams]);

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Email is required'),
            password: Yup.string().required('Password is required'),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            const toastId = toast.loading('Logging in...');
            try {
                const { data } = await axiosInstance.post('/auth/login', { ...values, role });
                updateUser(data); // Update global user state
                toast.success('Login successful!', { id: toastId });

                // Redirect based on role
                if (data.role === 'admin') {
                    router.push('/admin/dashboard');
                } else if (data.role === 'company') {
                    router.push('/company/dashboard');
                } else {
                    router.push('/student/dashboard');
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Login failed', { id: toastId });
                setSubmitting(false);
            }
        },
    });

    const roles = [
        { name: 'student', label: 'Student', icon: User },
        { name: 'company', label: 'Company', icon: Building },
        { name: 'admin', label: 'Admin', icon: Shield },
    ];

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-2xl">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
                <p className="mt-2 text-gray-600">Log in to continue to your dashboard.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 rounded-lg bg-gray-100">
                {roles.map((r) => (
                    <button key={r.name} onClick={() => setRole(r.name)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${role === r.name ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:bg-white/50'}`}>
                        {r.label}
                    </button>
                ))}
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-6">
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                    error={formik.touched.email && formik.errors.email}
                    icon={Mail}
                />
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    error={formik.touched.password && formik.errors.password}
                    icon={Lock}
                />
                <Button type="submit" fullWidth disabled={formik.isSubmitting}>
                    {formik.isSubmitting ? 'Logging In...' : 'Login'}
                </Button>
            </form>
            <p className="text-sm text-center text-gray-500">
                Don't have an account?{' '}
                <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
                    Sign Up
                </Link>
            </p>
        </div>
    );
}


// The main page component that uses Suspense
export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Toaster position="top-center" />
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
