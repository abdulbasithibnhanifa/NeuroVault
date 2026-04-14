"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ThemeToggle from './ThemeToggle';
import { cn } from '@neurovault/shared/lib/utils';

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Vault', path: '/documents' },
    { label: 'AI Chat', path: '/chat' },
    { label: 'Graph', path: '/graph' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <span className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">NeuroVault</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                    pathname === item.path
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            
            <div className="h-8 w-px bg-gray-100 dark:bg-gray-800 mx-1 hidden sm:block" />

            {session ? (
              <div className="relative" ref={profileRef}>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-black text-gray-900 dark:text-gray-100">{session.user?.name}</span>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Knowledge Owner</span>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={cn(
                      "p-0.5 rounded-full border-2 transition-all active:scale-95 shrink-0",
                      isProfileOpen ? "border-blue-500" : "border-transparent hover:border-blue-500/50"
                    )}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-black text-blue-600 dark:text-blue-400 shadow-inner">
                      {session.user?.name?.[0] || 'U'}
                    </div>
                  </button>
                </div>

                {/* Profile Dropdown */}
                <div className={cn(
                  "absolute right-0 mt-3 w-56 origin-top-right rounded-[24px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl p-2 transition-all duration-300",
                  isProfileOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                )}>
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 mb-1">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Account</p>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{session.user?.email}</p>
                  </div>
                  
                  <Link 
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Profile
                  </Link>
                  
                  <Link 
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43 1.002l1.004.814a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-1.002l-1.004-.814a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>

                  <div className="h-px bg-gray-50 dark:bg-gray-800 my-1" />

                  <button 
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 sm:px-6 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button - PREMIUM IMPROVEMENT */}
            <button 
              className="md:hidden flex items-center justify-center p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - FULL OVERLAY REFINEMENT */}
      <div className={cn(
        "md:hidden fixed inset-0 top-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl transition-all duration-500 ease-in-out z-40 overflow-hidden",
        isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="p-6 space-y-3 flex flex-col items-center justify-center min-h-[50vh]">
          {navItems.map((item, idx) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "w-full text-center px-6 py-5 rounded-3xl text-xl font-black transition-all duration-300 transform",
                pathname === item.path
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-500/25 scale-105"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-105 active:scale-95"
              )}
              style={{ 
                transitionDelay: `${idx * 50}ms`,
                transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-20px)'
              }}
            >
              {item.label}
            </Link>
          ))}
          
          <div className="pt-8 w-full">
            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full mb-8" />
            <div className="flex flex-col items-center gap-2 opacity-60 italic">
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">NeuroVault Ecosystem</span>
               <span className="text-[8px] font-bold">Authenticated Knowledge Owner Session</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
