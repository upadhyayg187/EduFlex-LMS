import Link from 'next/link';
import { BookOpen, Users, ArrowRight, Star, GraduationCap, Building, Zap } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';

// --- Reusable Components for this Page ---

const StarRating = ({ rating = 0, reviewCount = 0, className = '' }) => (
    <div className={`flex items-center gap-1 ${className}`}>
        <p className="font-bold text-sm text-yellow-500">{rating.toFixed(1)}</p>
        <div className="flex">
            {[...Array(5)].map((_, index) => (
                <Star key={index} className={`h-4 w-4 ${rating > index ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
        <p className="text-xs text-gray-500">({reviewCount})</p>
    </div>
);

const CourseCard = ({ course }) => (
    <div className="group block overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        {/* --- FIX: Thumbnail container --- */}
        <div className="h-48 relative overflow-hidden bg-slate-100 flex items-center justify-center">
            <Image
                src={course.thumbnail?.url || 'https://placehold.co/600x400/e2e8f0/475569?text=EduFlex'}
                alt={course.title}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'contain' }}
            />
        </div>
        <div className="p-5">
            <p className="text-sm font-semibold text-blue-600">{course.level || 'All Levels'}</p>
            <h3 className="mt-2 text-lg font-bold text-gray-900 leading-tight h-14">{course.title}</h3>
            <p className="mt-2 text-sm text-gray-500">by {course.createdBy?.name || 'EduFlex Instructors'}</p>
            <div className="mt-4 flex items-center justify-between">
                <p className="text-xl text-gray-900 font-bold">₹{course.price}</p>
                <StarRating rating={course.averageRating} reviewCount={course.reviewCount} />
            </div>
        </div>
    </div>
);

const PublicHeader = () => (
    <header className="absolute top-0 left-0 w-full z-50 py-4 px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-x-2">
                <div className="bg-white p-2 rounded-lg shadow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#2563EB"/>
                        <path d="M2 17L12 22L22 17L12 12L2 17Z" fill="rgba(37, 99, 235, 0.6)"/>
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">EduFlex</h2>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-700">
                <Link href="#courses" className="hover:text-blue-600 transition-colors">Courses</Link>
                <Link href="/login?role=company" className="hover:text-blue-600 transition-colors">For Companies</Link>
            </nav>
            <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">Log In</Link>
                <Link href="/signup" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-all">
                    Sign Up
                </Link>
            </div>
        </div>
    </header>
);

const PublicFooter = () => (
    <footer className="bg-slate-900 text-slate-400">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                <div className="space-y-8 xl:col-span-1">
                     <Link href="/" className="flex items-center gap-x-2">
                        <div className="bg-white p-2 rounded-lg">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#2563EB"/><path d="M2 17L12 22L22 17L12 12L2 17Z" fill="rgba(37, 99, 235, 0.6)"/></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">EduFlex</h2>
                    </Link>
                    <p className="text-sm">Unlock your potential with expert-led courses.</p>
                </div>
                <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
                     <div className="md:grid md:grid-cols-2 md:gap-8">
                        <div>
                             <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Solutions</h3>
                             <ul className="mt-4 space-y-2">
                                <li><Link href="#" className="hover:text-white">For Students</Link></li>
                                <li><Link href="#" className="hover:text-white">For Companies</Link></li>
                            </ul>
                        </div>
                         <div className="mt-12 md:mt-0">
                            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Support</h3>
                             <ul className="mt-4 space-y-2">
                                <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                                <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                            </ul>
                        </div>
                    </div>
                     <div className="md:grid md:grid-cols-2 md:gap-8">
                        <div>
                             <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Company</h3>
                             <ul className="mt-4 space-y-2">
                                <li><Link href="#" className="hover:text-white">About</Link></li>
                                <li><Link href="#" className="hover:text-white">Blog</Link></li>
                            </ul>
                        </div>
                         <div className="mt-12 md:mt-0">
                             <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Legal</h3>
                             <ul className="mt-4 space-y-2">
                                <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                                <li><Link href="#" className="hover:text-white">Terms</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-12 border-t border-slate-800 pt-8">
                 <p className="text-base text-center">&copy; {new Date().getFullYear()} EduFlex, Inc. All rights reserved.</p>
            </div>
        </div>
    </footer>
);


// --- Main Server Component Logic ---

async function getFeaturedCourses() {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${apiUrl}/courses/public`);
        return response.data.slice(0, 4);
    } catch (error) {
        console.error("Failed to fetch featured courses:", error.message);
        return [];
    }
}

export default async function HomePage() {
    const featuredCourses = await getFeaturedCourses();

    return (
        <div className="bg-white text-slate-800">
            <PublicHeader />

            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-slate-50 pt-32 pb-20 lg:pt-48 lg:pb-28">
                     <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tighter">
                            Your Gateway to <span className="text-blue-600">Expert-Led</span> Learning
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
                            Master new skills and achieve your goals with our extensive library of online courses. Taught by industry professionals.
                        </p>
                        <div className="mt-10 flex justify-center gap-4 flex-wrap">
                            <Link href="/search" className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transform hover:-translate-y-1 transition-all duration-300">
                                Explore Courses <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Key Features Section */}
                 <section className="py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600"><GraduationCap size={28}/></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Expert Instructors</h3>
                                    <p className="mt-1 text-base text-slate-600">Learn from the best in the field, with curated content and practical examples.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                 <div className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600"><Building size={28}/></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">For Companies & Teams</h3>
                                    <p className="mt-1 text-base text-slate-600">Upskill your entire team with our business solutions and group plans.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                 <div className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600"><Zap size={28}/></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">Learn at Your Pace</h3>
                                    <p className="mt-1 text-base text-slate-600">Access your courses anytime, anywhere, and learn on your own schedule.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Featured Courses Section */}
                <section id="courses" className="bg-slate-50 py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl mx-auto text-center">
                             <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Featured Courses</h2>
                             <p className="mt-4 text-lg text-slate-600">
                                Handpicked courses to help you get started on your learning journey.
                             </p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {featuredCourses.length > 0 ? featuredCourses.map(course => (
                                <CourseCard key={course._id} course={course} />
                            )) : <p className="col-span-full text-center text-gray-500">No featured courses available at the moment.</p>}
                        </div>
                         <div className="mt-16 text-center">
                            <Link href="/search" className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                                View All Courses <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl mx-auto text-center">
                             <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Loved by Learners Worldwide</h2>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-slate-50 p-8 rounded-xl">
                                <p className="text-slate-700">&quot;This platform changed the way I learn. The courses are high-quality and the instructors are top-notch. Highly recommended!&quot;</p>
                                <div className="mt-4 flex items-center">
                                    <Image className="h-12 w-12 rounded-full" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Jane Doe" width={48} height={48}/>
                                    <div className="ml-4">
                                        <p className="font-semibold text-slate-900">Jane Doe</p>
                                        <p className="text-sm text-slate-500">Software Engineer</p>
                                    </div>
                                </div>
                            </div>
                             <div className="bg-slate-50 p-8 rounded-xl">
                                <p className="text-slate-700">&quot;As an instructor, EduFlex provides all the tools I need to create and sell my courses. The dashboard is intuitive and powerful.&quot;</p>
                                <div className="mt-4 flex items-center">
                                    <Image className="h-12 w-12 rounded-full" src="https://i.pravatar.cc/150?u=a042581f4e29026705d" alt="John Smith" width={48} height={48}/>
                                    <div className="ml-4">
                                        <p className="font-semibold text-slate-900">John Smith</p>
                                        <p className="text-sm text-slate-500">Tech Instructor</p>
                                    </div>
                                </div>
                            </div>
                             <div className="bg-slate-50 p-8 rounded-xl">
                                <p className="text-slate-700">&quot;I&apos;ve completed three courses here and each one has directly helped me in my career. The quality is simply unmatched.&quot;</p>
                                <div className="mt-4 flex items-center">
                                    <Image className="h-12 w-12 rounded-full" src="https://i.pravatar.cc/150?u=a042581f4e29026706d" alt="Emily White" width={48} height={48}/>
                                    <div className="ml-4">
                                        <p className="font-semibold text-slate-900">Emily White</p>
                                        <p className="text-sm text-slate-500">Product Manager</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                 {/* Final CTA Section */}
                <section className="bg-white">
                     <div className="container mx-auto py-20 px-4 sm:px-6 lg:px-8">
                        <div className="bg-slate-900 rounded-2xl p-16 text-center shadow-xl">
                            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Join Thousands of Successful Learners Today</h2>
                            <p className="mt-4 text-lg text-slate-300">Take the next step towards your personal and professional goals.</p>
                            <div className="mt-8">
                                <Link href="/SignUp" className="inline-block px-10 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-slate-200 transform hover:-translate-y-1 transition-all">
                                    Get Started For Free
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <PublicFooter />
        </div>
    );
}
