import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Provider';
import { AuthProvider } from '@/context/AuthContext'; // 1. Import AuthProvider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kerala Migrant Health Record System',
  description: 'A digital platform for managing the health records of migrant workers in Kerala.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
           <AuthProvider>
  <Toaster position="top-center" />
  <Navbar /> {/* Navbar MUST be inside AuthProvider */}
  <main className="pt-16">
      {children}
  </main>
</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}