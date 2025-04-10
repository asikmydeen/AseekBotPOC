// app/providers.tsx
"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Import ThemeInitializer to handle theme initialization
import ThemeInitializer from './utils/ThemeInitializer';

// Initialize Zustand stores
import './store/themeStore';
import './store/chatHistoryStore';
import './store/artifactStore';
import './store/apiStore';
import './store/promptsStore';
import './store/chatStore';

interface ProviderProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProviderProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Force client-side navigation to the correct page on initial load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // If we're at the root but the URL path indicates we should be elsewhere
            const path = window.location.pathname;

            // Check if we're supposed to be on userguide
            if (path.includes('/userguide') && pathname === '/') {
                console.log('Redirecting to userguide page');
                router.push('/userguide');
            }
        }
    }, [pathname, router]);

    return (
        <>
            {/* Initialize theme */}
            <ThemeInitializer />

            {/* Render children directly - all state is now managed by Zustand */}
            {children}
        </>
    );
}