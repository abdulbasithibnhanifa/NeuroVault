import React from 'react';

/**
 * GraphLoading - Optimized skeleton state for the knowledge graph visualization.
 * Ensures the page layout is preserved while the heavy graph library initializes.
 */
export default function GraphLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-32" />
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl w-64" />
          <div className="h-4 bg-gray-50 dark:bg-gray-900 rounded-lg w-96" />
        </div>
      </div>

      {/* Main Graph Skeleton */}
      <div className="relative w-full h-[70vh] bg-gray-50 dark:bg-[#030712] rounded-[40px] border border-gray-100 dark:border-gray-800 flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-4 opacity-40">
           <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Neural Network Syncing...</p>
        </div>
      </div>

      {/* Stats/Insights Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-50 dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-800" />
        ))}
      </div>
    </div>
  );
}
