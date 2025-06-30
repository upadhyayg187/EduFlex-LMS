'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Clock, BarChart2, Star, PlayCircle, Lock, BookOpen } from 'lucide-react';

export default function ViewCoursePage() {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const { courseId } = useParams();

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            try {
                const { data } = await axiosInstance.get(`/courses/public/${courseId}`);
                setCourse(data);
            } catch (error) {
                toast.error("Sorry, this course could not be found.");
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen font-semibold text-gray-500">Loading course details...</div>;
    }

    if (!course) {
        return <div className="flex justify-center items-center h-screen font-semibold text-red-500">Course Not Found. It may be a draft or has been removed.</div>;
    }

    const totalLessons = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);

    return (
        <div className="bg-gray-50 min-h-screen">
            <Toaster position="top-center" />
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <p className="text-sm font-semibold text-blue-600">{course.level}</p>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2">{course.title}</h1>
                            <p className="text-lg text-gray-600 mt-4">{course.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500 mt-6 border-t pt-4">
                                <span>Created by <strong className="text-gray-800">{course.createdBy?.name || 'EduFlex'}</strong></span>
                                <span className="flex items-center gap-1.5"><Clock size={16} /> Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Curriculum Section */}
                        <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Content</h2>
                            <div className="space-y-4">
                                {course.curriculum.map((section, index) => (
                                    <div key={section._id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 p-4 font-semibold text-gray-800">
                                            Module {index + 1}: {section.title}
                                        </div>
                                        <ul className="divide-y divide-gray-200">
                                            {section.lessons.map(lesson => (
                                                <li key={lesson._id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                                    <div className="flex items-center gap-3">
                                                        <PlayCircle className="text-gray-400" size={20} />
                                                        <span className="text-gray-700">{lesson.title}</span>
                                                    </div>
                                                    <Lock className="text-gray-400" size={16} title="Lesson requires enrollment" />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Card */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-8">
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <img src={course.thumbnail.url || 'https://placehold.co/400x225/e0e7ff/3730a3?text=Course'} alt={course.title} className="w-full h-48 object-cover" />
                                <div className="p-6">
                                    <h2 className="text-3xl font-bold text-gray-900">
                                        {course.price > 0 ? `₹${course.price}` : 'Free'}
                                    </h2>
                                    <button className="mt-4 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-sm">
                                        Enroll Now
                                    </button>
                                    <div className="text-sm text-gray-600 space-y-3 mt-6">
                                        <p className="flex items-center gap-2"><BookOpen size={16} /> <strong>{course.curriculum.length}</strong> Modules</p>
                                        <p className="flex items-center gap-2"><PlayCircle size={16} /> <strong>{totalLessons}</strong> Lessons</p>
                                        <p className="flex items-center gap-2"><BarChart2 size={16} /> Skill Level: <strong>{course.level}</strong></p>
                                        {course.offerCertificate && (
                                            <p className="flex items-center gap-2"><Star size={16} /> <strong>Certificate</strong> of Completion</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
