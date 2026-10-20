import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Campus-Share | University Hardware & CAD Resource Platform',
  description:
    'Non-profit peer-to-peer and lab-to-peer platform for university engineering students to borrow hardware components and share CAD models.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 bg-slate-950 border-b border-slate-800" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 w-full">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
