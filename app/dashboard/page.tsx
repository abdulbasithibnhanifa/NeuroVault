"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalDocs: number;
  pendingDocs: number;
  processedDocs: number;
  sharedWithMe: number;
  recentActivity: Array<{
    _id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

/**
 * DashboardPage - Central hub for system status and knowledge base statistics.
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-3xl" />)}
        </div>
        <div className="h-64 bg-gray-50 dark:bg-gray-900 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
          System Overview
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
          Real-time metrics from your personal intelligence ecosystem.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Knowledge" 
          value={stats?.totalDocs || 0} 
          icon="docs" 
          color="blue"
        />
        <StatCard 
          label="Active Indices" 
          value={stats?.processedDocs || 0} 
          icon="check" 
          color="green"
        />
        <StatCard 
          label="Syncing Tasks" 
          value={stats?.pendingDocs || 0} 
          icon="sync" 
          color="amber"
          pulse={stats?.pendingDocs ? stats.pendingDocs > 0 : false}
        />
        <StatCard 
          label="Collaborations" 
          value={stats?.sharedWithMe || 0} 
          icon="users" 
          color="indigo"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 italic">Recent Activity</h2>
            <Link href="/documents" className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              View All Vault
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.recentActivity.length === 0 ? (
              <div className="text-center py-12 opacity-40 italic font-medium">No recent knowledge ingestion.</div>
            ) : (
              stats?.recentActivity.map(doc => (
                <div key={doc._id} className="group flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${doc.status === 'indexed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-blue-600 transition-colors">{doc.title}</h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                    doc.status === 'indexed' ? 'bg-green-100/50 text-green-700' : 'bg-amber-100/50 text-amber-700'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Tips / Integration Health */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 -mr-16 -mt-16 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
          
          <h2 className="text-xl font-bold mb-6 relative">System Ecosystem</h2>
          
          <div className="space-y-6 relative">
            <HealthItem label="Database" status="active" />
            <HealthItem label="Vector Stream" status="active" />
            <HealthItem label="Sync Worker" status="active" />
            <HealthItem label="LLM Orchestrator" status="active" />
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 relative">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-60">AI Tip</h4>
            <p className="text-xs font-medium leading-relaxed opacity-90 italic">
              &quot;Try asking complex relationships in the Chat. Your knowledge graph is now fully mapped to your semantic indices.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, pulse = false }: any) {
  const colors: any = {
    blue: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/10 text-green-600',
    amber: 'bg-amber-50 dark:bg-amber-900/10 text-amber-600',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600'
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</label>
        {pulse && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tighter">{value}</span>
      </div>
    </div>
  );
}

function HealthItem({ label, status }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
      <span className="text-sm font-bold opacity-80">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{status}</span>
      </div>
    </div>
  );
}
