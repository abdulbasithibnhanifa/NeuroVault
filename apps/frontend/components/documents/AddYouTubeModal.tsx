"use client";

import React, { useState } from 'react';
import Button from '../ui/Button';
import { logger } from '@neurovault/shared/utils/logger';

interface AddYouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function AddYouTubeModal({ isOpen, onClose, onRefresh }: AddYouTubeModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title: 'YouTube Video' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit YouTube URL');
      }

      setUrl('');
      onRefresh?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
      logger.error('YouTube submission UI error', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 slide-in-from-bottom-5 duration-500">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-50 tracking-tight">Add YouTube Intelligence</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Paste any YouTube URL to ingest its transcript into your vault.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">YouTube URL</label>
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 dark:text-gray-50"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-2xl py-6">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1 rounded-2xl py-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                Process Video
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
