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
};

// Keeping the original structure with Providers
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.variable} antialiased w-full h-screen bg-white text-gray-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}