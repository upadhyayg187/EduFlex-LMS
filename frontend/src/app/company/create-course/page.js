'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast, Toaster } from 'react-hot-toast';
import { Info, Book, Settings, Upload, Trash, Plus, GripVertical, Film, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';

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
    const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
    const router = useRouter();

    const validationSchema = Yup.object({
        title: Yup.string().max(100, 'Title must be 100 characters or less').required('Course title is required'),
        description: Yup.string().required('A detailed description is required'),
        thumbnail: Yup.mixed().when('$isPublishing', {
            is: true,
            then: (schema) => schema.required('A course thumbnail image is required to publish.'),
            otherwise: (schema) => schema.nullable(),
        }),
        isPaid: Yup.boolean(),
        price: Yup.number().when('isPaid', {
            is: true,
            then: (schema) => schema.min(1, 'Price must be at least ₹1 for a paid course.').required('Price is required.'),
            otherwise: (schema) => schema.min(0),
        }),
        curriculum: Yup.array().of(
            Yup.object().shape({
                title: Yup.string().required('Section title is required'),
                lessons: Yup.array().of(
                    Yup.object().shape({
                       title: Yup.string().required('Lesson title is required'),
                       video: Yup.mixed().when('$isPublishing', {
                           is: true,
                           then: (schema) => schema.required('A video file is required for each lesson to publish.'),
                           otherwise: (schema) => schema.nullable(),
                       }),
                    })
                ).min(1, 'Each section must have at least one lesson.')
            })
        ).min(1, 'Course must have at least one section.')
    });

    const formik = useFormik({
        initialValues: {
            title: '', description: '', level: 'Beginner', tags: '', 
            isPaid: true, price: '', 
            offerCertificate: true,
            thumbnail: null,
            curriculum: [{ id: Date.now(), title: 'Module 1: Introduction', lessons: [{ id: Date.now() + 1, title: 'Welcome & Course Overview', video: null, videoName: '' }] }],
        },
        validationSchema: validationSchema,
        onSubmit: (values, { setSubmitting, resetForm }) => {
            handleCourseSubmit(values, 'Published', setSubmitting, resetForm);
        },
    });
    
    const handleCourseSubmit = async (values, status, setSubmitting, resetForm) => {
        if (status === 'Published') {
            try {
                await validationSchema.validate(values, { abortEarly: false, context: { isPublishing: true } });
            } catch (err) {
                const errors = {};
                if (err.inner) { err.inner.forEach(error => { errors[error.path] = error.message; }); }
                formik.setErrors(errors);
                toast.error('Please fill all required fields before publishing.');
                if (setSubmitting) setSubmitting(false);
                setIsSubmittingDraft(false);
                return;
            }
        }

        const toastId = toast.loading(status === 'Published' ? 'Publishing course...' : 'Saving draft...');
        const formData = new FormData();
        
        Object.keys(values).forEach(key => {
            if (key !== 'curriculum' && key !== 'thumbnail' && key !== 'isPaid') {
                formData.append(key, values[key]);
            }
        });
        formData.append('status', status);

        if (values.thumbnail) {
            formData.append('thumbnail', values.thumbnail);
        }

        const curriculumMetadata = values.curriculum.map(section => ({
            title: section.title,
            lessons: section.lessons.map(lesson => ({
                title: lesson.title,
                hasVideo: !!lesson.video,
            })),
        }));
        formData.append('curriculum', JSON.stringify(curriculumMetadata));

        values.curriculum.forEach(section => {
            section.lessons.forEach(lesson => {
                if (lesson.video) {
                    formData.append('videos', lesson.video);
                }
            });
        });

        try {
            await axiosInstance.post('/courses', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success(`Course ${status === 'Published' ? 'published' : 'saved as draft'}!`, { id: toastId });
            if (resetForm) resetForm();
            setThumbnailPreview('');
            router.push('/company/courses');
        } catch (error) {
            const errorMessage = error.response?.data?.message || `Failed to ${status.toLowerCase()} course.`;
            toast.error(errorMessage, { id: toastId });
        } finally {
            if (setSubmitting) setSubmitting(false);
            setIsSubmittingDraft(false);
        }
    };
    
    const handleSaveAsDraft = async () => {
        setIsSubmittingDraft(true);
        if (!formik.values.title) {
            toast.error('Please add a course title before saving a draft.');
            setIsSubmittingDraft(false);
            return;
        }
        await handleCourseSubmit(formik.values, 'Draft');
    };

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
        { id: 'settings', name: 'Settings & Pricing', icon: Settings }
    ];

    return (
        <div>
            <Toaster position="top-center" reverseOrder={false} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create a New Course</h1>
                <p className="text-lg text-gray-600 mt-1">Fill out the details below to get your course ready for students.</p>
            </div>
            
            <form onSubmit={formik.handleSubmit}>
                <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
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

                    <main className="lg:col-span-9 mt-8 lg:mt-0">
                        {activeSection === 'info' && (
                             <div className="space-y-8">
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Basic Information</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                                            <input type="text" id="title" {...formik.getFieldProps('title')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., The Ultimate React Masterclass" />
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
                                    <label htmlFor="thumbnail" className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 block">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">Drag & drop image, or <span className="font-semibold text-blue-600">click to browse</span></p>
                                        <input type="file" id="thumbnail" name="thumbnail" accept="image/*" className="hidden" onChange={(e) => {
                                            const file = e.currentTarget.files[0];
                                            if(file) { formik.setFieldValue('thumbnail', file); setThumbnailPreview(URL.createObjectURL(file)); }
                                        }}/>
                                    </label>
                                    {thumbnailPreview && (<div className="mt-6"><h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4><img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full md:w-1/2 rounded-lg shadow-md" /></div>)}
                                    {formik.touched.thumbnail && formik.errors.thumbnail && <p className="text-red-500 text-xs mt-1">{formik.errors.thumbnail}</p>}
                                </div>
                            </div>
                        )}
                        {activeSection === 'curriculum' && (
                             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                                <div className="flex justify-between items-center"><h3 className="text-xl font-semibold text-gray-800">Curriculum Builder</h3>
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
                                                            if(file){ formik.setFieldValue(`curriculum[${sectionIndex}].lessons[${lessonIndex}].video`, file); formik.setFieldValue(`curriculum[${sectionIndex}].lessons[${lessonIndex}].videoName`, file.name); }
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
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8">
                                <h3 className="text-xl font-semibold text-gray-800">Settings & Pricing</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
                                        <div className="flex items-center gap-x-2 p-1 rounded-lg bg-gray-100 border border-gray-200 w-fit">
                                            <button type="button" onClick={() => formik.setFieldValue('isPaid', true)} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${formik.values.isPaid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>
                                                Paid
                                            </button>
                                            <button type="button" onClick={() => { formik.setFieldValue('isPaid', false); formik.setFieldValue('price', 0); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${!formik.values.isPaid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>
                                                Free
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className={`transition-opacity duration-300 ${formik.values.isPaid ? 'opacity-100' : 'opacity-50'}`}>
                                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Course Price (₹)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">₹</span></div>
                                            <input type="number" id="price" {...formik.getFieldProps('price')} disabled={!formik.values.isPaid} className="w-full p-3 pl-8 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed" placeholder="0" />
                                        </div>
                                        {formik.touched.price && formik.errors.price && <p className="text-red-500 text-xs mt-1">{formik.errors.price}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                                        <select id="level" {...formik.getFieldProps('level')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All Levels</option></select>
                                    </div>
                                    
                                    <div className="col-span-2">
                                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Tag className="h-5 w-5 text-gray-400" /></div>
                                            <input type="text" id="tags" {...formik.getFieldProps('tags')} className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g., React, Web Dev, JS" />
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex items-center pt-2">
                                        <input id="offerCertificate" type="checkbox" {...formik.getFieldProps('offerCertificate')} checked={formik.values.offerCertificate} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                        <label htmlFor="offerCertificate" className="ml-2 block text-sm text-gray-900">Offer a Certificate upon Completion</label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
                <div className="mt-8 pt-5 border-t border-gray-200">
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={handleSaveAsDraft} disabled={isSubmittingDraft || formik.isSubmitting} className="py-2 px-5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition disabled:bg-gray-200 disabled:cursor-not-allowed">
                            {isSubmittingDraft ? 'Saving...' : 'Save as Draft'}
                        </button>
                        <button type="submit" disabled={formik.isSubmitting || isSubmittingDraft} className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {formik.isSubmitting ? 'Publishing...' : 'Publish Course'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
