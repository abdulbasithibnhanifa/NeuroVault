"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import DocumentList from '@/components/documents/DocumentList';
import DocumentUploader from '@/components/documents/DocumentUploader';

/**
 * DocumentsPage - Command center for managing the NeuroVault knowledge base.
 */
export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = React.useCallback(() => setRefreshKey(prev => prev + 1), []);

  const handleSearch = React.useCallback((query: string, newFilters?: any) => {
    setSearchTerm(query);
    if (newFilters) setFilters(newFilters);
  }, []);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-800">
            Vault Management
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
            Document Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl font-medium">
            Search, manage, and monitor your personal knowledge repository. All documents are indexed and ready for semantic retrieval.
          </p>
        </div>
        
        <DocumentUploader onRefresh={handleRefresh} />
      </div>

      {/* Search and Filter Section */}
      <div className="sticky top-20 z-10 py-4 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-xl border-y border-gray-100 dark:border-gray-800 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-colors">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Content Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
            {searchTerm || filters.type || filters.tags?.length > 0 ? `Filtered View` : 'All Documents'}
          </h2>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 mx-6" />
        </div>

        <DocumentList key={refreshKey} searchTerm={searchTerm} filters={filters} />
      </div>
    </div>
  );
}
