// app/providers.tsx
"use client";
import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeProvider } from './context/ThemeContext';
import { ChatHistoryProvider } from './context/ChatHistoryContext';
import { PromptsProvider } from './context/PromptsContext';


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
        <ThemeProvider initialDarkMode={true}>
            <ChatHistoryProvider>
                {children}
            </ChatHistoryProvider>
        </ThemeProvider>
    );
}