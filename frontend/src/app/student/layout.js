'use client';

import React from 'react';
import Sidebar from '@/components/student/Sidebar';
import Header from '@/components/student/Header';

export default function StudentLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="p-4 bg-gray-50 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
