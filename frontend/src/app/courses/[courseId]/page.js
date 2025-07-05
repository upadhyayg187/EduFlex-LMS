'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Lock, Star, Users, BarChart2, Award, AlertCircle, BookOpen } from 'lucide-react';
import Script from 'next/script';

const StarRating = ({ rating = 0, reviewCount = 0 }) => (
    <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-700">{rating.toFixed(1)}</span>
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="text-sm text-slate-500">({reviewCount} reviews)</span>
    </div>
);

function CourseDetailContent() {
    const { courseId } = useParams();
    const { user } = useUser();
    const router = useRouter();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await axiosInstance.get(`/courses/public/${courseId}`);
                setCourse(data);
                if (user && data.students.includes(user._id)) {
                    setIsEnrolled(true);
                }
            } catch (error) {
                console.error("Failed to fetch course details", error);
                toast.error("Could not load course details.");
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, user]);

    const handleEnrollment = async () => {
        if (!user) {
            toast.error("Please log in to enroll in a course.");
            router.push('/login?role=student');
            return;
        }

        const toastId = toast.loading("Processing enrollment...");

        try {
            const { data } = await axiosInstance.post(`/courses/${courseId}/enroll`);

            if (data.order) { // This is a paid course
                const options = {
                    // --- FIX: Use the key from environment variables ---
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: data.order.amount,
                    currency: "INR",
                    name: "EduFlex",
                    description: `Enrollment for ${course.title}`,
                    order_id: data.order.id,
                    handler: async function (response) {
                        const verificationToast = toast.loading("Verifying payment...");
                        try {
                            await axiosInstance.post('/payments/verify', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                courseId: course._id,
                            });
                            toast.success("Enrollment successful!", { id: verificationToast });
                            setIsEnrolled(true);
                        } catch (err) {
                            toast.error("Payment verification failed. Please contact support.", { id: verificationToast });
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                    },
                    theme: {
                        color: "#2563EB"
                    }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
                toast.dismiss(toastId);
            } else { // This is a free course
                toast.success("Successfully enrolled!", { id: toastId });
                setIsEnrolled(true);
            }

        } catch (error) {
            toast.error(error.response?.data?.message || "Enrollment failed.", { id: toastId });
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen font-semibold text-gray-500">Loading Course...</div>;
    if (!course) return <div className="flex items-center justify-center h-screen font-semibold text-red-500">Course not found.</div>;
    
    const totalLessons = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);

    return (
        <div className="bg-slate-50 min-h-screen">
             <Toaster position="top-center" />
             <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
                    <div className="lg:col-span-2">
                        <Link href="/search" className="text-blue-600 hover:underline text-sm mb-4 inline-block">&larr; Back to all courses</Link>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{course.title}</h1>
                        <p className="mt-4 text-lg text-slate-600">{course.description}</p>
                        <div className="mt-4 flex items-center gap-6">
                            <StarRating rating={course.averageRating} reviewCount={course.reviewCount} />
                            <div className="flex items-center gap-2 text-slate-500"><Users size={16}/><span>{course.students.length} students</span></div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">Created by <span className="font-semibold text-slate-700">{course.createdBy.name}</span></p>
                    </div>

                    <div className="lg:col-span-1 mt-8 lg:mt-0">
                        <div className="lg:sticky top-24">
                            <div className="bg-white rounded-xl shadow-lg border">
                                <div className="h-56 bg-slate-100 rounded-t-xl flex items-center justify-center">
                                    <img src={course.thumbnail.url} alt={course.title} className="w-full h-full object-contain" />
                                </div>
                                <div className="p-6">
                                    <p className="text-3xl font-bold text-slate-900">₹{course.price}</p>
                                    
                                    {isEnrolled ? (
                                        <Link href={`/student/courses/view/${course._id}`} className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all">
                                            Go to Course
                                        </Link>
                                    ) : (
                                        <button onClick={handleEnrollment} className="mt-4 w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all">
                                            Enroll Now
                                        </button>
                                    )}
                                    
                                    <ul className="mt-6 space-y-3 text-sm text-slate-600">
                                        <li className="flex items-center gap-3"><BookOpen size={16}/><span>{course.curriculum.length} sections • {totalLessons} lessons</span></li>
                                        <li className="flex items-center gap-3"><BarChart2 size={16}/><span>{course.level} Level</span></li>
                                        {course.offerCertificate && <li className="flex items-center gap-3"><Award size={16}/><span>Certificate of Completion</span></li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-slate-800">Course Content</h2>
                     <div className="mt-4 space-y-3">
                        {course.curriculum.map((section, index) => (
                            <div key={section._id} className="border bg-white rounded-lg">
                                <h3 className="w-full text-left px-5 py-4 font-semibold text-slate-800">{index + 1}. {section.title}</h3>
                                <ul className="border-t">
                                    {section.lessons.map(lesson => (
                                         <li key={lesson._id} className="flex items-center justify-between px-5 py-3 border-b last:border-b-0">
                                            <span className="text-slate-600">{lesson.title}</span>
                                            <Lock size={16} className="text-slate-400" />
                                         </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Wrap in Suspense because it's a dynamic page that uses hooks
export default function CourseDetailPage() {
    return (
        <Suspense fallback={<div className="text-center p-10 font-semibold text-gray-500">Loading...</div>}>
            <CourseDetailContent />
        </Suspense>
    );
}
