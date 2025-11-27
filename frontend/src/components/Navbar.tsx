'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartPulse, Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; 
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, logout } = useAuth(); 
  const router = useRouter();

  const handleLogout = () => {
    logout(); 
    setIsOpen(false);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#about', label: 'About' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
              <HeartPulse className="text-green-600 w-8 h-8" />
              <span className="text-xl font-bold text-gray-800">Kerala Migrant Health</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            
            {/* 1. ONLY SHOW LINKS IF NOT LOGGED IN */}
            {!isLoggedIn && navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-gray-600 hover:text-green-600 transition-colors font-medium">
                {link.label}
              </Link>
            ))}

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="flex items-center text-gray-600 hover:text-green-600 font-medium">
                  <User className="w-5 h-5 mr-1" />
                  Profile
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                   Login
                </Link>
                 <Link href="/auth/signup" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                    Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-700 hover:text-green-600 focus:outline-none">
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 p-4 bg-white shadow-lg rounded-b-lg">
             
             {/* 2. HIDE LINKS IN MOBILE MENU IF LOGGED IN */}
             {!isLoggedIn && navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)} 
                  className="text-gray-700 hover:bg-green-50 block px-3 py-2 rounded-md text-base font-medium"
                >
                  {link.label}
                </Link>
             ))}

             {isLoggedIn ? (
                 <>
                    <Link href="/profile" onClick={() => setIsOpen(false)} className="block py-2 text-gray-700 hover:text-green-600 font-medium">
                        <User className="inline w-4 h-4 mr-2"/> Profile
                    </Link>
                    <button onClick={handleLogout} className="block w-full text-left text-red-600 py-2 font-medium hover:bg-red-50 rounded-md">
                        <LogOut className="inline w-4 h-4 mr-2"/> Logout
                    </button>
                 </>
             ) : (
                 <>
                    <Link href="/auth/login" onClick={() => setIsOpen(false)} className="block py-2 text-green-600 font-semibold">Login</Link>
                    <Link href="/auth/signup" onClick={() => setIsOpen(false)} className="block py-2 text-gray-600">Sign Up</Link>
                 </>
             )}
        </div>
      )}
    </nav>
  );
}