'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/student/Sidebar';
import Header from '@/components/student/Header';

export default function StudentLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div>
            <Toaster position="top-center" />
            
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="lg:pl-72">
                <Header onMobileMenuToggle={() => setSidebarOpen(true)} />
                
                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
