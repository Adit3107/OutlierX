'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export const AdminRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.replace('/login');
            } else if (user?.role !== 'ADMIN') {
                router.replace('/dashboard');
            }
        }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <Loader2 className="animate-spin text-red-600 h-8 w-8" />
            </div>
        );
    }

    if (!isAuthenticated || user?.role !== 'ADMIN') {
        return null;
    }

    return children;
};
