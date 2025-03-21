// app/providers.tsx
"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeProvider } from './context/ThemeContext';
import { ChatHistoryProvider } from './context/ChatHistoryContext';

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

    // Set up theme preference detection
    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        // Check for saved theme preference
        const savedTheme = localStorage.getItem('aseekbot-theme');

        // If no saved preference, check for system preference
        if (!savedTheme) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            // Default to light theme regardless of system preference (per requirements)
            localStorage.setItem('aseekbot-theme', 'light');
        }

        // Apply the theme class to document
        const isDarkMode = savedTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, []);

    return (
        <ThemeProvider initialDarkMode={false}>
            <ChatHistoryProvider>
                {children}
            </ChatHistoryProvider>
        </ThemeProvider>
    );
}