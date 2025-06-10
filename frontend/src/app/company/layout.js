// /app/company/dashboard/layout.jsx
'use client';

import Sidebar from '@/components/company/Sidebar'; 
import Header from '@/components/company/Header';   
import React from 'react';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Optional top bar */}
        {/* <Header /> */}
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
