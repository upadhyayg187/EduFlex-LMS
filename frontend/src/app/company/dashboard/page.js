'use client';

import { ChartBar, BookOpen, Users, Settings } from 'lucide-react';

export default function CompanyDashboard() {
  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      {/* Top Greeting */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Welcome, Company Admin 👋</h1>
        <div className="flex items-center space-x-4">
          <img
            src="/company-avatar.png"
            alt="Company Avatar"
            className="w-10 h-10 rounded-full border border-gray-300"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard icon={<Users className="text-blue-500" />} title="Enrolled Students" value="450+" />
        <DashboardCard icon={<BookOpen className="text-green-500" />} title="Active Courses" value="12" />
        <DashboardCard icon={<ChartBar className="text-purple-500" />} title="Monthly Visitors" value="3.2K" />
        <DashboardCard icon={<Settings className="text-yellow-500" />} title="Pending Approvals" value="3" />
      </div>

      {/* Course Actions & Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quick Actions */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Quick Actions</h2>
          <ul className="space-y-3">
            <li><a href="/company/courses/new" className="text-blue-600 hover:underline">➕ Create New Course</a></li>
            <li><a href="/company/courses" className="text-blue-600 hover:underline">📚 View All Courses</a></li>
            <li><a href="/company/profile" className="text-blue-600 hover:underline">🧾 Edit Company Profile</a></li>
          </ul>
        </div>

        {/* Right: Announcements */}
        <div className="bg-white p-5 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Latest Announcements</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>🎉 New UI Design rollout in progress</li>
            <li>🛠️ Platform maintenance on Friday at 10 PM</li>
            <li>📢 Submit your Q2 report by 20th June</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ icon, title, value }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow flex items-center space-x-4">
      <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
      <div>
        <h3 className="text-gray-600 text-sm">{title}</h3>
        <p className="text-xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
