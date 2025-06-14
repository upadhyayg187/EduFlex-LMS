'use client';
import React from 'react';

export default function CompanyProfile() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Company Profile</h2>
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Company Details</h3>
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Name:</strong> EduFlex Company</li>
            <li><strong>Email:</strong> company@eduflex.com</li>
            <li><strong>Phone:</strong> +1 234 567 890</li>
            <li><strong>Address:</strong> Lucknow, UttarPradesh</li>
            <li><strong>Joined:</strong> Jan 1, 2024</li>
          </ul>
        </div>

        {/* Right: Avatar */}
        <div className="flex justify-center items-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
            ED
          </div>
        </div>
      </div>
    </div>
  );
}
