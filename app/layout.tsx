// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AseekBot - Data Center Procurement Companion',
  description: 'An AI-powered chatbot for data center procurement tasks.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
};

// Keeping the original structure with Providers
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased w-full h-screen`}>
        <a href="#main-content" className="sr-only focus:block p-2 bg-blue-600 text-white">Skip to main content</a>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
