
'use client';

import { TrendingUp, BookOpen, Users, Star, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import useUser from '@/hooks/useUser';

const stats = [
  { name: 'Total Revenue', stat: '$71,897', change: '1.2%', changeType: 'increase', icon: TrendingUp },
  { name: 'Active Courses', stat: '12', change: '9.1%', changeType: 'increase', icon: BookOpen },
  { name: 'New Students (30d)', stat: '2,450', change: '4.1%', changeType: 'decrease', icon: Users },
  { name: 'Average Rating', stat: '4.82', change: '0.6%', changeType: 'increase', icon: Star },
]

const topCourses = [
    { name: 'Ultimate React Masterclass', category: 'Web Development', students: '1.2k', rating: 4.9, image: '[https://placehold.co/100x60/3b82f6/ffffff?text=React](https://placehold.co/100x60/3b82f6/ffffff?text=React)' },
    { name: 'Advanced Node.js', category: 'Backend', students: 876, rating: 4.8, image: '[https://placehold.co/100x60/10b981/ffffff?text=Node](https://placehold.co/100x60/10b981/ffffff?text=Node)' },
    { name: 'Tailwind CSS From Scratch', category: 'UI/UX Design', students: 654, rating: 4.9, image: '[https://placehold.co/100x60/8b5cf6/ffffff?text=CSS](https://placehold.co/100x60/8b5cf6/ffffff?text=CSS)' },
]

export default function CompanyDashboard() {
  const user = useUser();
  const userName = user?.name || 'Admin';

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight">Welcome Back, {userName} 👋</h1>
        <p className="mt-1 text-md text-gray-600">Here's a summary of your company's performance.</p>
      </div>

      {/* Stats Grid */}
      <div>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="relative overflow-hidden rounded-lg bg-white p-5 shadow-sm border border-gray-200">
                <dt>
                    <div className="absolute rounded-md bg-blue-500 p-3">
                        <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                    <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                        item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {item.changeType === 'increase' ? 
                            <ArrowUp className="h-5 w-5 flex-shrink-0 self-center text-green-500" /> : 
                            <ArrowDown className="h-5 w-5 flex-shrink-0 self-center text-red-500" />}
                        {item.change}
                    </p>
                </dd>
              </div>
            )
           })}
        </dl>
      </div>
      
      {/* Main Grid: Top Courses Table */}
      <div>
        <h2 className="text-base font-semibold leading-6 text-gray-900">Top Performing Courses</h2>
        <div className="mt-2 overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Course</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Students</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rating</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {topCourses.map(course => (
                        <tr key={course.name} className="hover:bg-gray-50">
                            <td className="w-full max-w-0 py-4 pl-4 pr-3 text-sm sm:w-auto sm:max-w-none sm:pl-6">
                                <div className="flex items-center gap-4">
                                    <img src={course.image} alt="" className="h-12 w-20 rounded-md object-cover"/>
                                    <div>
                                        <div className="font-medium text-gray-900">{course.name}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500">{course.students}</td>
                            <td className="px-3 py-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {course.rating}
                                </span>
                            </td>
                            <td className="py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                               <button className="text-gray-400 hover:text-gray-700"><MoreVertical size={20} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
