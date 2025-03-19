// app/not-found.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    useEffect(() => {
        // Get the current path and try to route to it
        const path = window.location.pathname;

        if (path.includes('/userguide')) {
            router.push('/userguide');
        } else {
            // Fallback to home
            router.push('/');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Loading AseekBot...</h1>
                <p className="text-gray-600 dark:text-gray-300">Please wait while we redirect you to the correct page.</p>
            </div>
        </div>
    );
}