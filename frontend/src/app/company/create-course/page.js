'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, Toaster } from 'react-hot-toast';
import { Info, Book, Settings, Upload, Trash, Plus, GripVertical, Film, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance'; // Using the configured instance is crucial

// A placeholder for a rich text editor. For a real app, you'd use a library like 'react-quill'.
const RichTextEditor = ({ value, onChange, placeholder }) => (
    <textarea
        className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
    />
);

export default function CreateCoursePage() {
    const [activeSection, setActiveSection] = useState('info');
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const router = useRouter();

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            level: 'Beginner',
            tags: '',
            price: 0,
            offerCertificate: true,
            thumbnail: null,
            curriculum: [
                {
                    id: Date.now(),
                    title: 'Module 1: Introduction',
                    lessons: [
                        { id: Date.now() + 1, title: 'Welcome & Course Overview', video: null, videoName: '' }
                    ]
                }
            ],
        },
        validationSchema: Yup.object({
            title: Yup.string().max(100, 'Title must be 100 characters or less').required('Course title is required'),
            description: Yup.string().required('A detailed description is required'),
            thumbnail: Yup.mixed().required('A course thumbnail image is required'),
            price: Yup.number().min(0, 'Price cannot be negative').required('Price is required'),
            curriculum: Yup.array().of(
                Yup.object().shape({
                    title: Yup.string().required('Section title is required'),
                    lessons: Yup.array().of(
                        Yup.object().shape({
                           title: Yup.string().required('Lesson title is required'),
                           video: Yup.mixed().required('A video file is required for each lesson.'),
                        })
                    ).min(1, 'Each section must have at least one lesson.')
                })
            ).min(1, 'Course must have at least one section.')
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            const toastId = toast.loading('Publishing your course...');
            const formData = new FormData();

            // Append all text and boolean fields
            formData.append('title', values.title);
            formData.append('description', values.description);
            formData.append('level', values.level);
            formData.append('tags', values.tags);
            formData.append('price', values.price);
            formData.append('offerCertificate', values.offerCertificate);
            
            // Append the thumbnail file
            formData.append('thumbnail', values.thumbnail);

            // Stringify curriculum metadata (titles) and append it
            const curriculumMetadata = values.curriculum.map(section => ({
                title: section.title,
                lessons: section.lessons.map(lesson => ({ title: lesson.title }))
            }));
            formData.append('curriculum', JSON.stringify(curriculumMetadata));

            // Append all video files in the correct order under the same field name 'videos'
            values.curriculum.forEach(section => {
                section.lessons.forEach(lesson => {
                    formData.append('videos', lesson.video);
                });
            });

            try {
                // The axiosInstance now handles the auth token automatically
                await axiosInstance.post('/courses', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                toast.success('Course published successfully!', { id: toastId });
                resetForm();
                setThumbnailPreview('');
                router.push('/company/courses'); // Redirect to the manage courses page
            } catch (error) {
                // Display the specific error message from the backend if it exists
                const errorMessage = error.response?.data?.message || 'Failed to publish course. Please check all fields and try again.';
                toast.error(errorMessage, { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
    });
    
    // --- Helper functions for managing the curriculum state in Formik ---
    const addSection = () => {
        const newCurriculum = [...formik.values.curriculum, { id: Date.now(), title: `New Section`, lessons: [] }];
        formik.setFieldValue('curriculum', newCurriculum);
    };

    const addLesson = (sectionIndex) => {
        const newLesson = { id: Date.now(), title: `New Lesson`, video: null, videoName: '' };
        const newCurriculum = [...formik.values.curriculum];
        newCurriculum[sectionIndex].lessons.push(newLesson);
        formik.setFieldValue('curriculum', newCurriculum);
    };
    
    const removeSection = (sectionIndex) => {
        const newCurriculum = formik.values.curriculum.filter((_, i) => i !== sectionIndex);
        formik.setFieldValue('curriculum', newCurriculum);
    };
    
    const removeLesson = (sectionIndex, lessonIndex) => {
        const newCurriculum = [...formik.values.curriculum];
        newCurriculum[sectionIndex].lessons = newCurriculum[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
        formik.setFieldValue('curriculum', newCurriculum);
    };

    const sections = [
        { id: 'info', name: 'Course Information', icon: Info },
        { id: 'curriculum', name: 'Curriculum Builder', icon: Book },
        { id: 'settings', name: 'Settings & Pricing', icon: Settings },
    ];

    // --- The JSX for rendering the page ---
    return (
        <div>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create a New Course</h1>
                <p className="text-lg text-gray-600 mt-1">Fill out the details below to get your course ready for students.</p>
            </div>
            
            <form onSubmit={formik.handleSubmit}>
                <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
                    {/* Left Creator Sidebar Navigation */}
                    <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
                        <nav className="space-y-2">
                            {sections.map((section) => (
                                <button type="button" key={section.id} onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                                        activeSection === section.id ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'
                                    }`}>
                                    <section.icon className="h-5 w-5"/>
                                    <span className="font-medium text-sm">{section.name}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <main className="lg:col-span-9 mt-8 lg:mt-0">
                        {/* Conditional Rendering of Form Sections */}
                        {activeSection === 'info' && (
                             <div className="space-y-8">
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Basic Information</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                                            <input type="text" id="title" {...formik.getFieldProps('title')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="e.g., The Ultimate React Masterclass" />
                                            {formik.touched.title && formik.errors.title && <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
                                            <RichTextEditor value={formik.values.description} onChange={(e) => formik.setFieldValue('description', e.target.value)} placeholder="Tell students what they will learn in this course..." />
                                            {formik.touched.description && formik.errors.description && <p className="text-red-500 text-xs mt-1">{formik.errors.description}</p>}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Course Thumbnail</h3>
                                    <label htmlFor="thumbnail" className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition block">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">Drag & drop image, or <span className="font-semibold text-blue-600">click to browse</span></p>
                                        <input type="file" id="thumbnail" name="thumbnail" accept="image/*" className="hidden" onChange={(e) => {
                                            const file = e.currentTarget.files[0];
                                            if(file) {
                                                formik.setFieldValue('thumbnail', file);
                                                setThumbnailPreview(URL.createObjectURL(file));
                                            }
                                        }}/>
                                    </label>
                                    {thumbnailPreview && (<div className="mt-6"><h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4><img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full md:w-1/2 rounded-lg shadow-md" /></div>)}
                                    {formik.touched.thumbnail && formik.errors.thumbnail && <p className="text-red-500 text-xs mt-1">{formik.errors.thumbnail}</p>}
                                </div>
                            </div>
                        )}
                        {activeSection === 'curriculum' && (
                             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-gray-800">Curriculum Builder</h3>
                                    <button type="button" onClick={addSection} className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg shadow-sm focus:outline-none transition"><Plus size={18} /> Add Section</button>
                                </div>
                                <div className="space-y-4">
                                    {formik.values.curriculum.map((section, sectionIndex) => (
                                        <div key={section.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-4">
                                                <GripVertical className="text-gray-400 cursor-grab" />
                                                <input type="text" value={section.title} onChange={formik.handleChange} name={`curriculum[${sectionIndex}].title`} className="w-full font-semibold text-gray-800 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none" />
                                                <button type="button" onClick={() => removeSection(sectionIndex)} className="text-gray-400 hover:text-red-500"><Trash size={18}/></button>
                                            </div>
                                            <div className="space-y-3 pl-8">
                                                {section.lessons.map((lesson, lessonIndex) => (
                                                    <div key={lesson.id} className="flex items-center gap-3 bg-white p-3 rounded-md border">
                                                        <Film size={20} className="text-gray-500" />
                                                        <div className="flex-grow">
                                                            <input type="text" value={lesson.title} onChange={formik.handleChange} name={`curriculum[${sectionIndex}].lessons[${lessonIndex}].title`} className="w-full text-sm text-gray-700 focus:outline-none" />
                                                            <div className="text-xs text-blue-600 mt-1">{lesson.videoName || "No video selected"}</div>
                                                        </div>
                                                        <label htmlFor={`video-${lesson.id}`} className="cursor-pointer text-gray-500 hover:text-blue-600"><Upload size={18} /></label>
                                                        <input type="file" id={`video-${lesson.id}`} accept="video/*" className="hidden" onChange={(e) => {
                                                            const file = e.currentTarget.files[0];
                                                            if(file){
                                                                formik.setFieldValue(`curriculum[${sectionIndex}].lessons[${lessonIndex}].video`, file);
                                                                formik.setFieldValue(`curriculum[${sectionIndex}].lessons[${lessonIndex}].videoName`, file.name);
                                                            }
                                                        }}/>
                                                        <button type="button" onClick={() => removeLesson(sectionIndex, lessonIndex)} className="text-gray-400 hover:text-red-500"><Trash size={16}/></button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addLesson(sectionIndex)} className="text-sm flex items-center gap-1 text-blue-600 font-medium hover:underline"><Plus size={16} /> Add Lesson</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeSection === 'settings' && (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                                <h3 className="text-xl font-semibold text-gray-800">Settings & Pricing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                                        <select id="level" {...formik.getFieldProps('level')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                            <option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                        <input type="text" id="tags" {...formik.getFieldProps('tags')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="e.g., React, Web Dev, JS" />
                                    </div>
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Course Price</label>
                                        <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DollarSign className="h-5 w-5 text-gray-400" /></div>
                                            <input type="number" id="price" {...formik.getFieldProps('price')} className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="0 for free" />
                                        </div>
                                        {formik.touched.price && formik.errors.price && <p className="text-red-500 text-xs mt-1">{formik.errors.price}</p>}
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <input id="offerCertificate" type="checkbox" {...formik.getFieldProps('offerCertificate')} checked={formik.values.offerCertificate} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                        <label htmlFor="offerCertificate" className="ml-2 block text-sm text-gray-900">Offer Certificate on Completion</label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* Footer with action buttons */}
                <div className="mt-8 pt-5 border-t border-gray-200">
                    <div className="flex justify-end gap-4">
                        <button type="button" className="py-2 px-5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition">Save as Draft</button>
                        <button type="submit" disabled={formik.isSubmitting} className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition disabled:bg-gray-400">
                            {formik.isSubmitting ? 'Publishing...' : 'Publish Course'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
