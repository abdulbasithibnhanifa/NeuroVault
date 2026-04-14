"use client";

import React from 'react';
import Modal from '../ui/Modal';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  searchQuery?: string;
}

/**
 * DocumentPreviewModal - Rich text viewer with search highlighting.
 */
export default function DocumentPreviewModal({ 
  isOpen, 
  onClose, 
  title, 
  content, 
  searchQuery 
}: DocumentPreviewModalProps) {
  
  // Highlighting logic
  const getHighlightedContent = () => {
    if (!searchQuery || searchQuery.length < 2) return content;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/60 dark:text-yellow-100 rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Knowledge Preview"
    >
      <div className="space-y-6">
        <div className="animate-in slide-in-from-left duration-300">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-1">Authenticated Document</label>
          <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h4>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl h-[60vh] overflow-y-auto custom-scrollbar select-text">
            {content ? (
              <div className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 font-medium whitespace-pre-wrap">
                {getHighlightedContent()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-sm font-bold tracking-tight">Vault ingestion in progress...</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-auto flex items-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Private Index Access
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </Modal>
  );
}
