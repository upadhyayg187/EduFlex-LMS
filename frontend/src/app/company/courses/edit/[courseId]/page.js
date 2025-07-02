'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { Upload, Tag, Info, Book, GripVertical, Trash, Plus, Film } from 'lucide-react';

const RichTextEditor = ({ name, value, onChange, placeholder }) => (
    <textarea
        name={name}
        className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
    />
);

export default function EditCoursePage() {
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('info');
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const router = useRouter();
    const { courseId } = useParams();

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            level: 'Beginner',
            tags: '',
            isPaid: true,
            price: 0,
            offerCertificate: false,
            status: 'Draft',
            thumbnail: null,
            curriculum: [],
        },
        validationSchema: Yup.object({
            title: Yup.string().required('Course title is required'),
            price: Yup.number().min(0).required('Price is required'),
        }),
        onSubmit: async (values, { setSubmitting }) => {
            const toastId = toast.loading('Updating course...');
            const formData = new FormData();
            
            const curriculumMetadata = values.curriculum.map(section => ({
                _id: section._id,
                title: section.title,
                lessons: section.lessons.map(lesson => ({
                    _id: lesson._id,
                    title: lesson.title,
                    hasVideo: !!lesson.video,
                    videoUrl: lesson.videoUrl, 
                    isNew: !lesson._id,
                }))
            }));
            formData.append('curriculum', JSON.stringify(curriculumMetadata));

            formData.append('title', values.title);
            formData.append('description', values.description);
            formData.append('level', values.level);
            formData.append('tags', values.tags);
            formData.append('price', values.price);
            formData.append('offerCertificate', values.offerCertificate);
            formData.append('status', values.status);

            if (values.thumbnail) {
                formData.append('thumbnail', values.thumbnail);
            }
            
            values.curriculum.forEach(section => {
                section.lessons.forEach(lesson => {
                    if (lesson.video && !lesson._id) {
                        formData.append('videos', lesson.video);
                    }
                });
            });

            try {
                await axiosInstance.put(`/courses/${courseId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Course updated successfully!', { id: toastId });
                router.push('/company/courses');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to update course.', { id: toastId });
            } finally {
                setSubmitting(false);
            }
        },
    });

    useEffect(() => {
        if (!courseId) return;
        const fetchCourseData = async () => {
            try {
                const { data } = await axiosInstance.get(`/courses/${courseId}`);
                formik.setValues({
                    title: data.title,
                    description: data.description,
                    level: data.level,
                    tags: data.tags.join(', '),
                    price: data.price,
                    isPaid: data.price > 0,
                    offerCertificate: data.offerCertificate,
                    status: data.status,
                    thumbnail: null,
                    curriculum: data.curriculum,
                }, false);
                if (data.thumbnail && data.thumbnail.url) {
                    setThumbnailPreview(data.thumbnail.url);
                }
            } catch (error) {
                toast.error('Failed to fetch course data.');
                router.push('/company/courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    // --- FIX IS HERE ---
    // The validation logic is now centralized in this function before submission.
    const handleFormSubmit = async (statusToSet) => {
        // Run stricter validation only when the user intends to publish.
        if (statusToSet === 'Published') {
            if (!formik.values.thumbnail && !thumbnailPreview) {
                toast.error('A thumbnail is required to publish.');
                return;
            }
            if (!formik.values.description?.trim()) {
                toast.error('A course description is required to publish.');
                setActiveSection('info'); // Switch to the relevant section
                return;
            }
            if (!formik.values.tags?.trim()) {
                toast.error('At least one tag is required to publish.');
                setActiveSection('info');
                return;
            }
            if (formik.values.curriculum.length === 0 || formik.values.curriculum.some(s => s.lessons.length === 0)) {
                toast.error('The course must have at least one section, and each section must have at least one lesson.');
                setActiveSection('curriculum');
                return;
            }
            const hasMissingVideo = formik.values.curriculum.some(section =>
                section.lessons.some(lesson => !lesson.videoUrl && !lesson.video)
            );
            if (hasMissingVideo) {
                toast.error('Every lesson must have a video to publish the course.');
                setActiveSection('curriculum');
                return;
            }
        }
        
        // If validation passes (or if saving a draft), proceed with submission.
        await formik.setFieldValue('status', statusToSet);
        formik.handleSubmit();
    };
    // --- END OF FIX ---

    const addSection = () => {
        formik.setFieldValue('curriculum', [...formik.values.curriculum, { id: Date.now(), title: 'New Section', lessons: [] }]);
    };
    const addLesson = (sectionIndex) => {
        const newLesson = { id: Date.now(), title: 'New Lesson', video: null, videoName: '' };
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

    const pageSections = [{ id: 'info', name: 'Course Information', icon: Info }, { id: 'curriculum', name: 'Curriculum Builder', icon: Book }];

    if (loading) {
        return <div className="text-center p-10 font-semibold text-gray-500">Loading course editor...</div>;
    }

    return (
        <div className="space-y-8">
            <Toaster position="top-center" />
            <form onSubmit={(e) => e.preventDefault()}>
                <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
                    <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
                        <nav className="space-y-2">
                           {pageSections.map((section) => (
                                <button type="button" key={section.id} onClick={() => setActiveSection(section.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${activeSection === section.id ? 'bg-blue-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100'}`}>
                                    <section.icon className="h-5 w-5"/>
                                    <span className="font-medium text-sm">{section.name}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>
                    
                    <main className="lg:col-span-9 mt-8 lg:mt-0">
                        {activeSection === 'info' && (
                            <div className="space-y-8">
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
                                    <h3 className="text-xl font-semibold text-gray-800">Edit Basic Information</h3>
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                                        <input type="text" id="title" {...formik.getFieldProps('title')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        {formik.touched.title && formik.errors.title && <p className="text-red-500 text-xs mt-1">{formik.errors.title}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
                                        <RichTextEditor {...formik.getFieldProps('description')} />
                                        {formik.touched.description && formik.errors.description && <p className="text-red-500 text-xs mt-1">{formik.errors.description}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Type</label>
                                            <div className="flex items-center gap-x-2 p-1 rounded-lg bg-gray-100 border border-gray-200 w-fit">
                                                <button type="button" onClick={() => formik.setFieldValue('isPaid', true)} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${formik.values.isPaid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>Paid</button>
                                                <button type="button" onClick={() => { formik.setFieldValue('isPaid', false); formik.setFieldValue('price', 0); }} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${!formik.values.isPaid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>Free</button>
                                            </div>
                                        </div>
                                        <div className={`transition-opacity duration-300 ${formik.values.isPaid ? 'opacity-100' : 'opacity-50'}`}>
                                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Course Price (₹)</label>
                                            <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">₹</span></div>
                                                <input type="number" step="1" id="price" {...formik.getFieldProps('price')} disabled={!formik.values.isPaid} className="w-full p-3 pl-8 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200" />
                                            </div>
                                            {formik.touched.price && formik.errors.price && <p className="text-red-500 text-xs mt-1">{formik.errors.price}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                                            <select id="level" {...formik.getFieldProps('level')} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
                                        </div>
                                        <div>
                                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                            <div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" id="tags" {...formik.getFieldProps('tags')} className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                                        </div>
                                        <div className="flex items-center pt-6">
                                            <input id="offerCertificate" type="checkbox" {...formik.getFieldProps('offerCertificate')} checked={formik.values.offerCertificate} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                            <label htmlFor="offerCertificate" className="ml-2 block text-sm text-gray-900">Offer Certificate on Completion</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-6">Update Thumbnail</h3>
                                    <label htmlFor="thumbnail" className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 block">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-2 text-sm text-gray-600">Drag & drop new image, or <span className="font-semibold text-blue-600">click to browse</span></p>
                                        <input type="file" id="thumbnail" name="thumbnail" accept="image/*" className="hidden" onChange={(e) => {
                                            const file = e.currentTarget.files[0];
                                            if(file) { formik.setFieldValue('thumbnail', file); setThumbnailPreview(URL.createObjectURL(file)); }
                                        }}/>
                                    </label>
                                    {thumbnailPreview && (<div className="mt-6"><h4 className="text-sm font-medium text-gray-700 mb-2">Current / New Preview:</h4><img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full md:w-1/2 rounded-lg shadow-md" /></div>)}
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
                                        <div key={section._id || section.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-4">
                                                <GripVertical className="text-gray-400 cursor-grab" />
                                                <input type="text" {...formik.getFieldProps(`curriculum[${sectionIndex}].title`)} className="w-full font-semibold text-gray-800 bg-transparent border-b" />
                                                <button type="button" onClick={() => removeSection(sectionIndex)}><Trash size={18} className="text-red-500"/></button>
                                            </div>
                                            <div className="space-y-3 pl-8">
                                                {section.lessons.map((lesson, lessonIndex) => (
                                                    <div key={lesson._id || lesson.id} className="flex items-center gap-3 bg-white p-3 rounded-md border">
                                                        <Film size={20} className="text-gray-500" />
                                                        <div className="flex-grow">
                                                            <input type="text" {...formik.getFieldProps(`curriculum[${sectionIndex}].lessons[${lessonIndex}].title`)} className="w-full text-sm"/>
                                                            <div className="text-xs text-blue-600 mt-1">{lesson.videoName || (lesson.videoUrl ? 'Current video saved' : 'No video selected')}</div>
                                                        </div>
                                                        <label htmlFor={`video-edit-${lesson.id || lessonIndex}`}><Upload size={18} className="cursor-pointer"/></label>
                                                        <input type="file" id={`video-edit-${lesson.id || lessonIndex}`} accept="video/*" className="hidden" onChange={(e) => {
                                                            const file = e.currentTarget.files[0];
                                                            if(file){ formik.setFieldValue(`curriculum[${sectionIndex}].lessons[${lessonIndex}].video`, file); formik.setFieldValue(`curriculum[${sectionIndex}].lessons[${lessonIndex}].videoName`, file.name); }
                                                        }}/>
                                                        <button type="button" onClick={() => removeLesson(sectionIndex, lessonIndex)}><Trash size={16} className="text-red-500"/></button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => addLesson(sectionIndex)} className="text-sm flex items-center gap-1 text-blue-600 font-medium hover:underline"><Plus size={16} /> Add Lesson</button>
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addSection} className="text-sm flex items-center gap-1 text-blue-600 font-medium hover:underline"><Plus size={16} /> Add Section</button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
                <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end gap-4">
                    <button type="button" onClick={() => router.back()} className="py-2 px-5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm">Cancel</button>
                    
                    <button type="button" onClick={() => handleFormSubmit('Draft')} disabled={formik.isSubmitting} className="py-2 px-5 bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 disabled:bg-gray-400">
                        {formik.isSubmitting && formik.values.status === 'Draft' ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button type="button" onClick={() => handleFormSubmit('Published')} disabled={formik.isSubmitting} className="py-2 px-5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
                        {formik.isSubmitting && formik.values.status === 'Published' ? 'Publishing...' : 'Save & Publish'}
                    </button>
                </div>
            </form>
        </div>
    );
}