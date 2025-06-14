export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-lg h-screen p-4">
      <h2 className="text-xl font-semibold mb-4">Company Dashboard</h2>
      <ul className="space-y-2">
        <li><a href="/company/dashboard" className="block">Dashboard</a></li>
        <li><a href="/company/courses" className="block">My Courses</a></li>
        <li><a href="/company/students" className="block">Enrolled Students</a></li>
      </ul>
    </aside>
  );
}
