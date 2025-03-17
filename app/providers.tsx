// app/providers.tsx
"use client";
import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ChatHistoryProvider } from './context/ChatHistoryContext';

interface ProviderProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProviderProps) {
    return (
        <ThemeProvider initialDarkMode={true}>
            <ChatHistoryProvider>
                {children}
            </ChatHistoryProvider>
        </ThemeProvider>
    );
}