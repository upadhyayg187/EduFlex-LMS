// ✅ 2. Hook: src/hooks/useUser.js
'use client';
import { useEffect, useState } from 'react';

export default function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('eduflex-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return user;
}
