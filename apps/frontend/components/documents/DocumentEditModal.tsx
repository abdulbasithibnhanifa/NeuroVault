"use client";

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { logger } from '@neurovault/shared/utils/logger';
import { stringToColor, stringToRGBA } from '@neurovault/shared/utils/colors';

interface DocumentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  initialTitle: string;
  initialTags: string[];
  initialSuggestedTags: string[];
  initialDescription?: string;
  onUpdate: (updatedDoc: any) => void;
}

/**
 * DocumentEditModal - Allows editing document metadata (title, tags, description).
 * Features: Pill Cloud tags, AI suggestions, AI summary with one-click apply, and manual re-generation.
 */
export default function DocumentEditModal({
  isOpen,
  onClose,
  documentId,
  initialTitle,
  initialTags,
  initialSuggestedTags,
  initialDescription,
  onUpdate,
}: DocumentEditModalProps) {
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState(initialTitle);
  const [tagList, setTagList] = useState<string[]>(initialTags || []);
  const [tagInput, setTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>(initialSuggestedTags || []);
  const [description, setDescription] = useState(initialDescription || '');
  const [aiSummary, setAiSummary] = useState(initialDescription || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the latest document data when the modal opens to avoid stale state
  // (e.g. the background worker updates a YouTube title after the card renders)
  React.useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/documents?id=${documentId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const doc = data.document || data;
        if (doc.title) setTitle(doc.title);
        if (doc.tags?.length > 0) setTagList(doc.tags);
        if (doc.suggestedTags?.length > 0) setSuggestedTags(doc.suggestedTags);
        if (doc.description) {
          setAiSummary(doc.description);
          setDescription(doc.description);
        }
      })
      .catch(() => {}); // non-critical, silently fail
  }, [isOpen, documentId]);

  const addTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (cleanTag && !tagList.includes(cleanTag)) {
      setTagList(prev => [...prev, cleanTag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTagList(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tagList.length > 0) {
      removeTag(tagList[tagList.length - 1]);
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tagList.includes(tag)) {
      setTagList(prev => [...prev, tag]);
    }
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  // --- Manual re-generation trigger ---
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/documents/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate');

      if (data.suggestedTags?.length > 0) {
        setSuggestedTags(data.suggestedTags.filter((t: string) => !tagList.includes(t)));
      }
      if (data.description) {
        setAiSummary(data.description);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/documents/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, title, tags: tagList, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update metadata');
      onUpdate(data.document);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const visibleSuggestions = suggestedTags.filter(
    st => !tagList.map(t => t.toLowerCase()).includes(st.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Doc Metadata">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* TITLE */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
            Document Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* TAGS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
              Tags
            </label>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="group flex items-center gap-1.5 text-[10px] font-black text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRegenerating ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Syncing AI...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  ✨ AI RE-SCAN
                </>
              )}
            </button>
          </div>

          {/* PILL CLOUD */}
          <div className="flex flex-wrap items-center gap-2 p-3.5 min-h-[64px] bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
            {tagList.map(tag => {
              const isDark = resolvedTheme === 'dark';
              const color = stringToColor(tag, isDark);
              const bg = stringToRGBA(tag, 0.1, isDark);
              return (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all animate-in zoom-in-95 duration-200"
                  style={{ 
                    color: color, 
                    backgroundColor: bg,
                    borderColor: stringToRGBA(tag, 0.2, isDark)
                  }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:bg-red-500 hover:text-white rounded-full p-0.5 transition-all ml-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })}
            <input
              type="text"
              placeholder={tagList.length === 0 ? 'Type tag and press Enter...' : ''}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-200 min-w-[150px] placeholder:text-gray-400 placeholder:font-medium"
            />
          </div>

          {/* SMART SUGGESTIONS */}
          {visibleSuggestions.length > 0 && (
            <div className="mt-3 px-1 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-grow bg-blue-100 dark:bg-blue-900/30" />
                <p className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest whitespace-nowrap">
                   Smart Suggestions
                </p>
                <div className="h-px flex-grow bg-blue-100 dark:bg-blue-900/30" />
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleSuggestions.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddSuggestedTag(tag)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl text-[10px] font-bold text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-all duration-300 hover:shadow-lg active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state hint */}
          {visibleSuggestions.length === 0 && suggestedTags.length === 0 && !isRegenerating && (
            <p className="text-[10px] text-gray-400 dark:text-gray-600 ml-1 italic">
              No AI suggestions yet. Click ✨ Re-generate to scan this document.
            </p>
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Give your document a description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium resize-none text-gray-700 dark:text-gray-200"
          />

          {/* AI SUMMARY REFERENCE — always visible if we have one */}
          {aiSummary && (
            <div className="mt-2 p-3 bg-purple-50/40 dark:bg-purple-900/10 border border-dashed border-purple-200/60 dark:border-purple-700/30 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black text-purple-600/70 dark:text-purple-400/60 uppercase tracking-widest">
                  ✦ AI-Generated Summary
                </span>
                {description !== aiSummary && (
                  <button
                    type="button"
                    onClick={() => setDescription(aiSummary)}
                    className="text-[10px] bg-purple-600 text-white px-3 py-0.5 rounded-lg font-bold hover:bg-purple-700 transition-colors active:scale-95"
                  >
                    Use as Description
                  </button>
                )}
                {description === aiSummary && (
                  <span className="text-[9px] text-green-600 dark:text-green-400 font-bold">✓ Applied</span>
                )}
              </div>
              <p className="text-[11px] text-purple-900/60 dark:text-purple-300/60 leading-relaxed italic line-clamp-3">
                {aiSummary}
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs font-bold text-red-500 ml-1">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 dark:border-gray-800/50">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl px-4">
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} variant="primary" className="rounded-2xl px-10 shadow-lg shadow-blue-500/20">
            Update Metadata
          </Button>
        </div>
      </form>
    </Modal>
  );
}
