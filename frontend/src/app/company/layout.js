// src/app/company/layout.js
'use client';

import Sidebar from '@/components/company/Sidebar';
import Header from '@/components/company/Header';
import React from 'react';

export default function CompanyLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-4 bg-gray-50 flex-1">{children}</main>
      </div>
    </div>
  );
}
