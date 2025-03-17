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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased w-full h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}