"use client";

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';

/**
 * GraphPage - Full-screen knowledge graph visualization dashboard.
 */
export default function GraphPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
            Visual Intelligence
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
            Knowledge Network
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl font-medium">
            Explore the hidden relationships within your second brain. This graph visualizes how your documents and topic tags interconnect.
          </p>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-[60px] blur-3xl" />
        <KnowledgeGraph />
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl group">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Semantic Clusters</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Automatically identifies clusters of related knowledge based on AI-generated topic tags.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl group">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-amber-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Omni-Vault View</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Includes both your private documents and collaborators' shared materials seamlessly.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl group">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-3.47 2.141 2.141zm9.846-12.617a6.744 6.744 0 11-1.204-1.359.363.363 0 01.353.136l1.066 1.22a.363.363 0 01-.215.568l-1.373.235z" />
            </svg>
          </div>
          <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Force-Directed Flow</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Physical simulation reveals the natural gravity of your most used tags and themes.</p>
        </div>
      </div>
    </div>
  );
}
