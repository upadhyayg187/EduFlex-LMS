'use client';

import Sidebar from '@/components/company/Sidebar';
import Header from '@/components/company/Header';
import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function CompanyLayout({ children }) {
  // This layout correctly structures the dashboard for fixed sidebars and scrolling content.
  return (
    <div className="bg-gray-50 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Sidebar is fixed on the left for large screens */}
      <Sidebar />

      {/* Main content area is pushed to the right of the sidebar */}
      <div className="lg:pl-72">
        {/* Header is sticky at the top of the main content area */}
        <Header />

        {/* The actual page content, with padding and scrollability */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}