'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useUser } from '@/context/UserContext'; // Import useUser

export default function Header() {
  const router = useRouter();
  const { logout } = useUser(); // Destructure logout from useUser context

  const handleLogout = async () => {
    try {
      // Use the logout function from UserContext
      logout();
      toast.success('Logged out successfully');
      // The logout() function from UserContext already handles the redirection to /login
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <header className="bg-white shadow-md py-3 px-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-blue-600">
        LMS Platform
      </Link>
      <div className="flex items-center space-x-4">
        {/* We can add user info and role-specific links here later */}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}