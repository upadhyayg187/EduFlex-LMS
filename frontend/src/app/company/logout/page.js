'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear tokens or user data here
    localStorage.clear();
    router.push('/login'); // Redirect to login page
  }, [router]);

  return <p className="p-6">Logging out...</p>;
}
