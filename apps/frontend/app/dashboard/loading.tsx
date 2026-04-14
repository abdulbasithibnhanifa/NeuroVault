import React from 'react';

/**
 * DashboardLoading - Premium skeleton state for the system overview.
 * Prevents layout shifts and provides immediate visual feedback.
 */
export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl w-1/4" />
        <div className="h-4 bg-gray-50 dark:bg-gray-900 rounded-lg w-1/2" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[450px] bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800" />
        <div className="h-[450px] bg-gray-50/50 dark:bg-gray-900/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-800" />
      </div>
    </div>
  );
}
