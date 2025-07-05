'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import axiosInstance from '@/helpers/axiosInstance';
import { toast, Toaster } from 'react-hot-toast';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle, PlayCircle, Notebook, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Debounce helper function to prevent spamming the API
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Main Component
export default function CourseConsumptionPage() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [openSections, setOpenSections] = useState({});
    const [lessonProgressMap, setLessonProgressMap] = useState(new Map());
    const [activeTab, setActiveTab] = useState('overview');
    const [isAutoplayOn, setIsAutoplayOn] = useState(true);
    const [notes, setNotes] = useState('');
    const videoRef = useRef(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const { data } = await axiosInstance.get(`/courses/student/${courseId}`);
                setCourse(data);
                
                const progressMap = new Map();
                data.progress.forEach(p => progressMap.set(p.lessonId.toString(), p));
                setLessonProgressMap(progressMap);

                setNotes(localStorage.getItem(`notes_${courseId}`) || '');

                if (data.curriculum?.[0]) {
                    setOpenSections({ [data.curriculum[0]._id]: true });
                }
            } catch (err) {
                setError("You are not authorized to view this course, or it does not exist.");
            } finally {
                setLoading(false);
            }
        };
        if (courseId) fetchCourse();
    }, [courseId]);
    
    useEffect(() => {
        if (courseId && notes !== undefined) {
            localStorage.setItem(`notes_${courseId}`, notes);
        }
    }, [notes, courseId]);

    const saveProgress = async (lessonId, progressUpdate) => {
        try {
            await axiosInstance.post('/students/progress', { courseId, lessonId, ...progressUpdate });
        } catch (error) {
            toast.error("Could not save progress.");
        }
    };
    
    const debouncedSaveTimestamp = useCallback(debounce((lessonId, time) => {
        saveProgress(lessonId, { timestamp: time });
    }, 5000), [courseId]);

    const handleLessonClick = (lesson) => {
        setCurrentLesson(lesson);
    };
    
    // --- FIX: This effect now only runs when the currentLesson changes ---
    useEffect(() => {
        if (currentLesson && videoRef.current) {
            const progress = lessonProgressMap.get(currentLesson._id.toString());
            const startTime = progress?.lastTimestamp || 0;
            videoRef.current.currentTime = startTime;
            // Autoplay and handle browser restrictions
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay was prevented by the browser.", error);
                });
            }
        }
    }, [currentLesson]);

    // --- FIX: This handler no longer causes a re-render ---
    const handleTimeUpdate = () => {
        if (videoRef.current && currentLesson) {
            const currentTime = videoRef.current.currentTime;
            debouncedSaveTimestamp(currentLesson._id, currentTime);
        }
    };

    const handleVideoEnd = () => {
        if (currentLesson) {
            const newProgressMap = new Map(lessonProgressMap);
            newProgressMap.set(currentLesson._id.toString(), {...newProgressMap.get(currentLesson._id.toString()), isCompleted: true});
            setLessonProgressMap(newProgressMap);
            saveProgress(currentLesson._id, { isCompleted: true });
        }
        
        if (!isAutoplayOn) return;
        
        const allLessons = course.curriculum.flatMap(s => s.lessons);
        const currentIndex = allLessons.findIndex(l => l._id === currentLesson._id);

        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
            handleLessonClick(allLessons[currentIndex + 1]);
        } else {
            toast.success("Congratulations! You've completed the course!");
        }
    };

    const toggleSection = (sectionId) => {
        setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const totalLessons = useMemo(() => course?.curriculum.reduce((acc, section) => acc + section.lessons.length, 0) || 0, [course]);
    const completedCount = useMemo(() => {
        let count = 0;
        lessonProgressMap.forEach(progress => { if (progress.isCompleted) count++; });
        return count;
    }, [lessonProgressMap]);
    const progressPercentage = useMemo(() => totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100), [completedCount, totalLessons]);

    if (loading) return <div className="flex justify-center items-center h-screen font-semibold text-gray-500">Loading Course...</div>;
    if (error) return (
        <div className="flex flex-col items-center justify-center text-center h-screen bg-gray-50">
            <AlertCircle className="w-16 h-16 text-red-400" /><h2 className="mt-4 text-xl font-semibold text-gray-800">Access Denied</h2>
            <p className="mt-1 text-gray-500">{error}</p>
            <Link href="/student/courses" className="mt-6 bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg shadow-sm hover:bg-blue-700">Go to My Courses</Link>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Toaster position="top-center" />
            <header className="flex items-center justify-between p-4 bg-white border-b shadow-sm flex-shrink-0">
                <Link href="/student/courses" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600"><ArrowLeft size={18} />Back to My Courses</Link>
                <h1 className="text-lg font-bold text-gray-800 truncate hidden md:block">{course.title}</h1>
                <div className="flex items-center gap-2">
                    <label htmlFor="autoplay-toggle" className="text-sm font-medium text-gray-700">Autoplay</label>
                    <button onClick={() => setIsAutoplayOn(!isAutoplayOn)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAutoplayOn ? 'bg-blue-600' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAutoplayOn ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 flex flex-col overflow-y-auto">
                    <div className="w-full aspect-video bg-black flex items-center justify-center">
                        {currentLesson?.videoUrl ? (
                            <video ref={videoRef} key={currentLesson._id} onEnded={handleVideoEnd} onTimeUpdate={handleTimeUpdate} controls className="w-full h-full object-contain">
                                <source src={currentLesson.videoUrl} type="video/mp4" />Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="text-center p-8 bg-cover bg-center rounded-lg" style={{backgroundImage: `url(${course.thumbnail?.url})`}}>
                                <div className="bg-black/60 p-8 rounded-lg">
                                    <h2 className="text-3xl font-bold text-white">Welcome to {course.title}!</h2>
                                    <p className="text-gray-300 mt-2">Select a lesson from the curriculum to begin learning.</p>
                                    <button onClick={() => course?.curriculum?.[0]?.lessons?.[0] && handleLessonClick(course.curriculum[0].lessons[0])} className="mt-6 bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition">Start Course</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-gray-900">{currentLesson?.title || 'Course Overview'}</h2>
                        <div className="border-b border-gray-200 mt-4">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Overview</button>
                                <button onClick={() => setActiveTab('notes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Notes</button>
                            </nav>
                        </div>
                        <div className="py-6">
                            {activeTab === 'overview' && <p className="text-gray-600 leading-relaxed">{course.description}</p>}
                            {activeTab === 'notes' && <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Write your personal notes here... They will be saved automatically to your browser." className="w-full h-64 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>}
                        </div>
                    </div>
                </main>

                <aside className="w-80 md:w-96 bg-white border-l border-gray-200 flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-lg text-gray-800 truncate">{course.title}</h2>
                        <p className="text-sm text-gray-500">{progressPercentage}% Complete ({completedCount} / {totalLessons} lessons)</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {course.curriculum.map((section, index) => (
                            <div key={section._id} className="border-b">
                                <button onClick={() => toggleSection(section._id)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none">
                                    <span>{index + 1}. {section.title}</span>
                                    {openSections[section._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                {openSections[section._id] && (
                                    <ul>
                                        {section.lessons.map((lesson) => (
                                            <li key={lesson._id}>
                                                <button onClick={() => handleLessonClick(lesson)} className={`w-full text-left p-4 pl-8 text-sm flex items-center gap-3 transition-colors ${currentLesson?._id === lesson._id ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}>
                                                    {lessonProgressMap.get(lesson._id.toString())?.isCompleted ? <CheckCircle size={16} className="text-green-500" /> : <PlayCircle size={16} className="text-gray-400" />}
                                                    <span className="flex-1">{lesson.title}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
