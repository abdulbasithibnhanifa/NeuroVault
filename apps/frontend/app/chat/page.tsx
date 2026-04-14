"use client";

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatWindow from '@/components/chat/ChatWindow';

/**
 * ChatPage - Interactive AI interface for querying the NeuroVault.
 * Provides a conversational wrapper around the RAG pipeline.
 */
export default function ChatPage() {
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
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Dynamic Neural Mesh Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/5 blur-[100px] animate-pulse [animation-delay:4s]" />
      </div>

      {/* 7-Day Memory Policy Badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="px-4 py-1.5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-gray-800/50 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-300">
            ⚡ Neural Pulse: <span className="text-blue-600 dark:text-blue-400">7-Day Memory Active</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-7xl h-[85vh] flex flex-col relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div className="flex-1 glass-card rounded-[3rem] border border-white/20 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 dark:from-white/5 dark:to-transparent pointer-events-none" />
          <ChatWindow />
        </div>

        {/* Status Indicators Footer */}
        <div className="mt-8 flex flex-wrap justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-3 group cursor-help">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="group-hover:text-green-500 transition-colors">RAG Retrieval Core</span>
          </div>
          <div className="flex items-center gap-3 group cursor-help">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="group-hover:text-blue-500 transition-colors">Contextual Cache Sync</span>
          </div>
          <div className="flex items-center gap-3 group cursor-help">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <span className="group-hover:text-indigo-500 transition-colors">Neural Latency Opt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
