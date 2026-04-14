"use client";

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function LandingPage() {
  const { status } = useSession();
  const getStartedHref = status === 'authenticated' ? '/dashboard' : '/login';

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10">
        <div className="text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-black uppercase tracking-[0.2em] border border-blue-100 dark:border-blue-800 backdrop-blur-md">
            The Second Brain, Evolved
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-gray-50 tracking-tighter leading-[0.9]">
            Your Knowledge <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Unleashed.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Store, search, and chat with your personal documents using state-of-the-art RAG technology. NeuroVault transforms static notes into an interactive intelligence ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <Link 
              href="/dashboard" 
              className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              Enter the Vault
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link 
              href={getStartedHref}
              className="px-10 py-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800 rounded-[2rem] font-black text-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none">
        <div className="absolute top-24 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Feature Grids */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Semantic Search" 
            desc="Find exactly what you need based on meaning, not just keywords." 
            icon="search"
          />
          <FeatureCard 
            title="AI Orchestration" 
            desc="Chat with your vault using advanced RAG pipelines for grounded answers." 
            icon="ai"
          />
          <FeatureCard 
            title="Knowledge Graph" 
            desc="Visualize the complex relationships between your documents and tags." 
            icon="graph"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: any) {
  return (
    <div className="p-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[3rem] hover:border-blue-500 transition-all duration-500 group">
      <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20 group-hover:rotate-12 transition-transform">
        {icon === 'search' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        )}
        {icon === 'ai' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 15L17.5 17.625l-.75-2.625a2.25 2.25 0 00-1.545-1.545L12.583 12.71a2.25 2.25 0 001.545-1.545l.75-2.625.75 2.625a2.25 2.25 0 001.545 1.545L21.25 15l-2.625.75a2.25 2.25 0 00-1.545 1.545L17.5 17.625 18.25 15z" />
          </svg>
        )}
        {icon === 'graph' && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        )}
      </div>
      <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
