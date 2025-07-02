'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('eduflex-user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('eduflex-user');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = (newUserData) => {
        // --- THE FIX IS HERE ---
        // 1. Check if the new data contains a token.
        if (newUserData?.token) {
            // 2. Store the token separately in localStorage.
            localStorage.setItem('userToken', newUserData.token);
        }
        // 3. Store the rest of the user details.
        setUser(newUserData);
        localStorage.setItem('eduflex-user', JSON.stringify(newUserData));
    };
    
    const logout = () => {
        setUser(null);
        localStorage.removeItem('eduflex-user');
        localStorage.removeItem('userToken'); // Also remove the token
        router.push('/login');
    };

    return (
        <UserContext.Provider value={{ user, updateUser, loading, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
