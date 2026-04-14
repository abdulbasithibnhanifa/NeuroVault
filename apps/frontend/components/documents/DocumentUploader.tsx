// components/documents/DocumentUploader.tsx
// File upload component for PDFs, notes, and YouTube URLs
// Handles drag-and-drop and file selection

interface DocumentUploaderProps {
  // onUpload: (file: File | string) => void;
}

"use client";

import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import AddNoteModal from './AddNoteModal';
import AddYouTubeModal from './AddYouTubeModal';
import { logger } from '@neurovault/shared/utils/logger';

interface DocumentUploaderProps {
  onRefresh?: () => void;
}

interface UploadQueueItem {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
}

/**
 * DocumentUploader - Multi-file batch uploader for various document types.
 * Supports PDF batching with real-time status tracking.
 */
export default function DocumentUploader({ onRefresh }: DocumentUploaderProps) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      status: 'pending',
      progress: 0,
    }));

    setQueue(prev => [...prev, ...newItems]);
    setIsProcessing(true);

    // Process uploads sequentially or in batches if preferred, 
    // but here we use Promise.all for true multi-file batching flow.
    try {
      await Promise.all(Array.from(files).map((file, index) => 
        uploadFile(file, newItems[index].id)
      ));
      
      // Auto-refresh the list after all uploads finish
      setTimeout(() => {
        onRefresh?.();
        setQueue([]);
        setIsProcessing(false);
      }, 1500);

    } catch (error) {
      console.error('Batch upload error:', error);
      setIsProcessing(false);
    }
  };

  const uploadFile = async (file: File, queueId: string) => {
    setQueue(prev => prev.map(item => 
      item.id === queueId ? { ...item, status: 'uploading', progress: 10 } : item
    ));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Strip extension for title

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      setQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, status: 'completed', progress: 100 } : item
      ));

    } catch (error) {
      setQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, status: 'error', progress: 0 } : item
      ));
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input 
          type="file" 
          multiple 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        
        <Button 
          variant="outline" 
          className="rounded-2xl border-dashed border-gray-300 dark:border-gray-700 px-6"
          disabled={isProcessing}
          onClick={() => setIsNoteModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Note
        </Button>

        <AddNoteModal 
          isOpen={isNoteModalOpen} 
          onClose={() => setIsNoteModalOpen(false)} 
          onRefresh={onRefresh}
        />

        <Button 
          variant="outline" 
          className="rounded-2xl border-dashed border-gray-300 dark:border-gray-700 px-6"
          disabled={isProcessing}
          onClick={() => setIsYouTubeModalOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h13.5M22.5 6.88a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.88v10.24a2.25 2.25 0 002.25 2.25h16.5a2.25 2.25 0 002.25-2.25V6.88zM4.12 14.28L12 9.71l7.88 4.57" />
          </svg>
          Add YouTube
        </Button>

        <AddYouTubeModal 
          isOpen={isYouTubeModalOpen} 
          onClose={() => setIsYouTubeModalOpen(false)} 
          onRefresh={onRefresh}
        />
        
        <Button 
          variant="primary" 
          className="rounded-2xl px-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
          onClick={() => fileInputRef.current?.click()}
          isLoading={isProcessing && queue.length === 0}
          disabled={isProcessing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {isProcessing ? `Uploading (${queue.filter(i => i.status === 'completed').length}/${queue.length})` : 'Upload PDFs'}
        </Button>
      </div>

      {/* Upload Queue Overlay/List */}
      {queue.length > 0 && (
        <div className="fixed bottom-8 right-8 w-80 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-6 z-50 animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Upload Queue</h4>
            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
              {queue.filter(i => i.status === 'completed').length} / {queue.length}
            </span>
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {queue.map(item => (
              <div key={item.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate pr-4">{item.name}</span>
                  {item.status === 'completed' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  )}
                  {item.status === 'error' && (
                    <span className="text-[8px] font-black text-red-500 uppercase">Error</span>
                  )}
                  {item.status === 'uploading' && (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${item.status === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
