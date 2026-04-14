"use client";

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

/**
 * AddNoteModal - A sleek modal for creating text-based notes.
 */
export default function AddNoteModal({ isOpen, onClose, onRefresh }: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create note');
      }

      onRefresh?.();
      onClose();
      setTitle('');
      setContent('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Note">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Note Title"
          placeholder="e.g., Weekly Project Summary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-1">
            Note Content
          </label>
          <textarea
            className="w-full h-40 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-inner"
            placeholder="Type or paste your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 rounded-2xl" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            isLoading={isSubmitting}
            disabled={!title || !content}
          >
            Create Note
          </Button>
        </div>
      </form>
    </Modal>
  );
}
