'use client';

export default function StudentDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome Back, Student 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats cards */}
        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold">Courses Enrolled</h2>
          <p className="text-2xl font-bold text-blue-600">4</p>
        </div>
        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold">Assignments Pending</h2>
          <p className="text-2xl font-bold text-yellow-600">2</p>
        </div>
        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-xl font-semibold">Feedbacks Given</h2>
          <p className="text-2xl font-bold text-green-600">3</p>
        </div>
      </div>

      {/* Recent Courses or Upcoming Tasks */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-semibold mb-4">Upcoming Tasks</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Submit assignment for React Basics (Due June 15)</li>
          <li>Watch Lecture 3: MongoDB - Indexing</li>
        </ul>
      </div>
    </div>
  );
}
