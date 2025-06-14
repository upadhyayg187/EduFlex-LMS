'use client';
import { useRouter } from 'next/navigation';

export default function useLogout() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('eduflex-user');
    router.push('/Login'); // Change path if your login route differs
  };

  return logout;
}



<header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 shadow-sm"></header>