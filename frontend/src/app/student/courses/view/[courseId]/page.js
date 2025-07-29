// LMS/frontend/src/app/student/courses/view/[courseId]/page.js
'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import axiosInstance from '@/helpers/axiosInstance';
import { toast } from 'react-hot-toast';
import { Lock, Star, Users, BarChart2, Award, FileDown, Eye, CheckCircle, PlayCircle, Notebook, ArrowLeft, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Debounce helper
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// CourseDetailContent component to be wrapped in Suspense
function CourseDetailContent() {
    const { courseId } = useParams();
    const router = useRouter();
    const { user } = useUser();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [openSections, setOpenSections] = useState({});
    const [lessonProgressMap, setLessonProgressMap] = useState(new Map());
    const [activeTab, setActiveTab] = useState('overview');
    const [isAutoplayOn, setIsAutoplayOn] = useState(false);
    const [notes, setNotes] = useState('');
    const videoRef = useRef(null);

    // State for certificate
    const [certificateAvailable, setCertificateAvailable] = useState(false);
    const [certificateId, setCertificateId] = useState(null);
    const [certificateUrl, setCertificateUrl] = useState(null);
    const [courseCompletionNotified, setCourseCompletionNotified] = useState(false); // To prevent repeated "all lessons completed" toast

    // Debounced function to save video timestamp
    const debouncedSaveTimestamp = useRef(debounce((lessonId, timestamp, isCompletedStatus) => {
        if (!lessonId || !user) return;
        saveProgress(lessonId, isCompletedStatus || false, timestamp);
    }, 5000)).current;

    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            try {
                setLoading(true);
                const { data } = await axiosInstance.get(`/courses/student/${courseId}`);
                setCourse(data);

                const initialProgressMap = new Map();
                data.progress.forEach(lp => initialProgressMap.set(lp.lessonId, { isCompleted: lp.isCompleted, lastTimestamp: lp.lastTimestamp }));
                setLessonProgressMap(initialProgressMap);

                if (data.curriculum && data.curriculum.length > 0) {
                    const firstSectionId = data.curriculum[0]._id;
                    setOpenSections(prev => ({ ...prev, [firstSectionId]: true }));
                }

                if (data.offerCertificate) {
                    const totalLessons = data.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);
                    const completedLessons = data.progress.filter(lp => lp.isCompleted).length;

                    if (totalLessons > 0 && completedLessons === totalLessons) {
                        setCourseCompletionNotified(true); // Mark as notified if already completed on fetch
                        const { data: certsData } = await axiosInstance.get(`/students/certificates?courseId=${courseId}`);
                        const foundCert = certsData.find(c => c.course._id === courseId);
                        if (foundCert) {
                            setCertificateAvailable(true);
                            setCertificateId(foundCert.certificateId);
                            setCertificateUrl(foundCert.certificateUrl);
                        }
                    }
                }

            } catch (err) {
                console.error("Failed to fetch course:", err);
                setError(err.response?.data?.message || 'Failed to load course details. You may not be authorized to view this course.');
                toast.error(err.response?.data?.message || 'Error loading course.');
                if (err.response?.status === 403) {
                    router.push('/student/courses');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();

        const savedNotes = localStorage.getItem(`course-notes-${courseId}-${user?._id}`);
        if (savedNotes) {
            setNotes(savedNotes);
        }

    }, [courseId, user?._id, router]);

    useEffect(() => {
        if (courseId && user) {
            localStorage.setItem(`course-notes-${courseId}-${user._id}`, notes);
        }
    }, [notes, courseId, user]);

    // This useEffect handles video playback when currentLesson changes
    useEffect(() => {
        console.log('--- useEffect: currentLesson changed (Video Playback useEffect) ---');
        console.log('currentLesson state (inside useEffect):', currentLesson);
        console.log('videoRef.current (inside useEffect):', videoRef.current);

        // Condition now also ensures videoUrl exists before trying to load/play
        if (videoRef.current && currentLesson && currentLesson.videoUrl) {
            console.log('Condition met: videoRef.current and valid currentLesson with videoUrl are present.');
            console.log('Video URL to set:', currentLesson.videoUrl);

            videoRef.current.src = currentLesson.videoUrl;
            videoRef.current.load(); // Load the new source

            const progress = lessonProgressMap.get(currentLesson._id); // Access map directly, NOT as a dependency
            if (progress && progress.lastTimestamp > 0) {
                videoRef.current.currentTime = progress.lastTimestamp;
                console.log('Resuming from timestamp:', progress.lastTimestamp);
            } else {
                videoRef.current.currentTime = 0;
                console.log('Starting from beginning.');
            }
            
            videoRef.current.play().catch(error => {
                console.warn('Autoplay prevented or playback failed:', error);
                if (error.name === 'NotAllowedError') {
                    toast.error('Autoplay prevented by browser. Please click the play button directly on the video.');
                } else if (error.name === 'AbortError') {
                    console.log('Video playback aborted (e.g., user clicked play then paused quickly).');
                } else {
                    toast.error(`Video playback failed: ${error.message}.`);
                }
            });
        } else if (currentLesson && !currentLesson.videoUrl) {
            console.warn('Current lesson has no video URL.');
            toast.info('This lesson does not have a video. Please select another lesson.');
        } else {
            console.log('Condition NOT met: videoRef.current or currentLesson (or videoUrl) is missing. Waiting for initial lesson selection or video content.');
        }
    }, [currentLesson]); // ***FIXED: Removed lessonProgressMap from dependencies***

    const saveProgress = async (lessonId, isCompletedStatus, timestamp) => {
        try {
            await axiosInstance.post('/students/progress', { courseId, lessonId, isCompleted: isCompletedStatus, timestamp });
            // Only update the local map if the API call is successful
            setLessonProgressMap(prev => new Map(prev).set(lessonId, { isCompleted: isCompletedStatus, lastTimestamp: timestamp }));
        } catch (err) {
            console.error('Failed to save progress:', err);
            toast.error('Failed to save progress.');
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && currentLesson) {
            debouncedSaveTimestamp(currentLesson._id, videoRef.current.currentTime);
        }
    };

    const handleVideoEnd = () => {
        if (currentLesson && course) { // Ensure course is available for calculations
            const currentLessonId = currentLesson._id;
            const videoDuration = videoRef.current ? videoRef.current.duration : 0;
            saveProgress(currentLessonId, true, videoDuration); // Mark current lesson as completed

            toast.success(`Lesson "${currentLesson.title}" completed!`);

            // Re-calculate course completion status based on potentially new lessonProgressMap state
            // (Note: lessonProgressMap might not be fully updated immediately here from saveProgress,
            // but this check serves for immediate feedback. Backend is authoritative for certificate.)
            const totalLessonsInCourse = course.curriculum.reduce((acc, section) => acc + section.lessons.length, 0);
            const currentCompletedLessons = Array.from(lessonProgressMap.values()).filter(lp => lp.isCompleted).length; // Reflects state before current saveProgress updates it
            const predictedCompletedLessons = currentCompletedLessons + (lessonProgressMap.get(currentLessonId)?.isCompleted ? 0 : 1); // If already completed, don't double count

            if (totalLessonsInCourse > 0 && predictedCompletedLessons >= totalLessonsInCourse && course.offerCertificate && !courseCompletionNotified) {
                toast.success('Congratulations! You have completed all lessons in this course!');
                setCourseCompletionNotified(true); // Prevent repeated toasts
                // The backend (saveCourseProgress) is responsible for actual certificate generation and notification
            }


            if (isAutoplayOn) {
                const flatLessons = course.curriculum.flatMap(section => section.lessons);
                const currentIndex = flatLessons.findIndex(lesson => lesson._id === currentLessonId);
                if (currentIndex !== -1 && currentIndex < flatLessons.length - 1) {
                    const nextLesson = flatLessons[currentIndex + 1];
                    if (nextLesson.videoUrl) {
                        setCurrentLesson(nextLesson);
                    } else {
                        toast.info(`Lesson "${nextLesson.title}" has no video. Skipping to next if autoplay enabled, or select manually.`);
                        // If no video, and it's the last lesson, or no more lessons with videos, consider course complete
                        // For now, just advance if videoUrl exists
                        const nextLessonWithVideo = flatLessons.slice(currentIndex + 1).find(l => l.videoUrl);
                        if (nextLessonWithVideo) {
                            setCurrentLesson(nextLessonWithVideo);
                        } else {
                            toast('No more video lessons available in this course for autoplay.');
                        }
                    }
                } else {
                    // This is the last lesson of the course
                    if (!courseCompletionNotified) {
                        toast('You have completed all lessons in this course!');
                        setCourseCompletionNotified(true);
                    }
                }
            } else {
                // Not autoplaying, just finished a lesson
                if (predictedCompletedLessons < totalLessonsInCourse) { // Only toast lesson complete if course not fully done
                   toast('You have completed this lesson!');
                }
            }
        }
    };

    // Calculate progress with useMemo for performance
    const { totalLessons, completedCount, progressPercentage } = useMemo(() => {
        const total = course?.curriculum.reduce((acc, section) => acc + section.lessons.length, 0) || 0;
        const completed = Array.from(lessonProgressMap.values()).filter(lp => lp.isCompleted).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { totalLessons: total, completedCount: completed, progressPercentage: percentage };
    }, [course?.curriculum, lessonProgressMap]);


    const toggleSection = (sectionId) => {
        setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const handleStartCourse = () => {
        if (course?.curriculum?.[0]?.lessons?.[0]) {
            console.log('--- handleStartCourse: Button clicked ---');
            console.log('Attempting to set first lesson:', course.curriculum[0].lessons[0]);
            setCurrentLesson(course.curriculum[0].lessons[0]);
        } else {
            console.warn('No curriculum or lessons found to start the course.');
            toast.error('Course curriculum is empty or invalid.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-700">Loading course content...</p>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-red-50 p-4 rounded-lg text-red-700">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-bold mb-2">{error || 'Course not found or access denied.'}</h2>
                <p className="mb-4 text-center">We couldn't load the course. It might not exist, or you might not have permission to view it.</p>
                <Link href="/student/courses" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Go to My Courses
                </Link>
            </div>
        );
    }

    // "Welcome to Course" splash screen if no lesson is selected or current lesson has no video
    if (!currentLesson || !currentLesson.videoUrl) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl text-center">
                    <img
                        src={course.thumbnail?.url || 'https://placehold.co/600x400/e2e8f0/475569?text=EduFlex'}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-md mb-6"
                    />
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to "{course.title}"!</h2>
                    <p className="text-gray-600 mb-6">
                        Ready to start your learning journey? Click the button below to begin your first lesson.
                    </p>
                    <button
                        onClick={handleStartCourse}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:-translate-y-1"
                    >
                        <PlayCircle className="mr-2 h-5 w-5" /> Start Course
                    </button>
                    <p className="mt-4 text-sm text-gray-500">
                        Instructor: {course.createdBy?.name || 'EduFlex Instructors'}
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
            {/* Main Content Area (Video Player & Details) */}
            <div className="flex-1 bg-white rounded-xl shadow-lg p-6 lg:order-1">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/student/courses" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Courses
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Autoplay:</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" checked={isAutoplayOn} onChange={() => setIsAutoplayOn(!isAutoplayOn)} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                {/* Video Player */}
                <div className="relative w-full overflow-hidden rounded-lg aspect-video bg-black">
                    <video
                        ref={videoRef}
                        controls
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnd}
                        controlsList="nodownload" // Prevent download button
                        disablePictureInPicture // Disable PiP mode
                    >
                        Your browser does not support the video tag.
                    </video>
                    {(!currentLesson || !currentLesson.videoUrl) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500 text-lg font-semibold">
                            No video available for this lesson.
                        </div>
                    )}
                </div>

                {currentLesson && (
                    <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">
                        Lesson: {currentLesson.title}
                    </h2>
                )}

                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`py-3 px-4 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`py-3 px-4 text-sm font-medium ${activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        onClick={() => setActiveTab('notes')}
                    >
                        Notes
                    </button>
                </div>

                {activeTab === 'overview' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Description</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">About the Instructor</h3>
                        <p className="text-gray-700 leading-relaxed">
                            {course.createdBy?.name || 'EduFlex Instructors'}
                        </p>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">My Personal Notes</h3>
                        <textarea
                            className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                            placeholder="Start typing your notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-2">Notes are saved automatically to your browser.</p>
                    </div>
                )}
            </div>

            {/* Sidebar (Curriculum & Progress) */}
            <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg p-6 flex flex-col flex-shrink-0 lg:order-2">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Course Curriculum</h3>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <p className="text-sm text-gray-600 mb-6">{completedCount} of {totalLessons} lessons completed ({progressPercentage}%)</p>

                {/* Certificate Section */}
                {course.offerCertificate && progressPercentage === 100 && certificateAvailable && (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Award className="h-5 w-5" />
                            <h4 className="font-semibold text-base">Course Completed! Certificate Available!</h4>
                        </div>
                        <p className="text-sm mb-4">Congratulations on completing "{course.title}"! Your certificate is ready.</p>
                        <div className="flex flex-col space-y-3">
                            <a
                                href={certificateUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-green-700 transition-colors"
                            >
                                <FileDown className="mr-2 h-5 w-5" /> Download Certificate
                            </a>
                            <Link
                                href={`/verify-certificate/${certificateId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 border border-blue-500 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <Eye className="mr-2 h-5 w-5" /> Verify Certificate
                            </Link>
                        </div>
                    </div>
                )}


                {/* Curriculum List */}
                <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                    {course.curriculum.map(section => (
                        <div key={section._id} className="mb-4 bg-gray-50 rounded-lg">
                            <button
                                onClick={() => toggleSection(section._id)}
                                className="flex items-center justify-between w-full p-4 text-left font-semibold text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                {section.title}
                                {openSections[section._id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                            {openSections[section._id] && (
                                <ul className="pl-6 pt-2 pb-4 space-y-2">
                                    {section.lessons.map(lesson => {
                                        const isCompleted = lessonProgressMap.get(lesson._id)?.isCompleted;
                                        return (
                                            <li
                                                key={lesson._id}
                                                onClick={() => setCurrentLesson(lesson)}
                                                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-blue-50 transition-colors
                                                    ${currentLesson?._id === lesson._id ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'}`
                                                }
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                ) : (
                                                    <PlayCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                )}
                                                <span className="flex-1">{lesson.title}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Wrapper to use Suspense
export default function CourseDetailPageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-gray-700">Loading course details...</p>
            </div>
        }>
            <CourseDetailContent />
        </Suspense>
    );
}