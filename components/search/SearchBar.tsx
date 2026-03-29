"use client";

import React, { useState, useEffect, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface SearchBarProps {
  onSearch: (query: string, filters?: any) => void;
  isLoading?: boolean;
}

/**
 * SearchBar Component - High-performance search input with debouncing and metadata filtering.
 */
export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const lastSearchRef = useRef('');
  const lastFiltersRef = useRef('');
  const initialRender = useRef(true);
  const filterRef = useRef<HTMLDivElement>(null);

  // Fetch unique tags from the user's documents for the filter list
  useEffect(() => {
    let isMounted = true;
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/documents');
        if (response.ok && isMounted) {
          const docs = await response.json();
          const tags = new Set<string>();
          docs.forEach((doc: any) => {
            if (doc.tags) doc.tags.forEach((t: string) => tags.add(t));
          });
          setAvailableTags(Array.from(tags).sort());
        }
      } catch (err) {
        console.error("Failed to fetch tags for filter", err);
      }
    };
    fetchTags();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const filtersStr = JSON.stringify({ type: selectedType, tags: selectedTags });
    
    if (initialRender.current) {
      initialRender.current = false;
      lastSearchRef.current = query;
      lastFiltersRef.current = filtersStr;
      return;
    }

    // Only search if actual values changed
    if (query === lastSearchRef.current && filtersStr === lastFiltersRef.current) {
      return;
    }

    const handler = setTimeout(() => {
      lastSearchRef.current = query;
      lastFiltersRef.current = filtersStr;
      onSearch(query, { type: selectedType, tags: selectedTags });
    }, 400);

    return () => clearTimeout(handler);
  }, [query, selectedType, selectedTags, onSearch]);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilters = selectedType || selectedTags.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="flex gap-2">
        <div className="flex-grow">
          <Input
            type="text"
            placeholder="Search documents by title or content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className={isLoading ? 'w-5 h-5 animate-spin' : 'w-5 h-5'}
              >
                {isLoading ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                )}
              </svg>
            }
            rightIcon={query && !isLoading ? (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : undefined}
          />
        </div>
        
        <div className="relative" ref={filterRef}>
          <Button
            variant={hasActiveFilters ? "primary" : "outline"}
            className="h-full rounded-2xl px-4 flex gap-2 items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <span className="hidden sm:inline font-bold uppercase tracking-widest text-[10px]">Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
          </Button>

          {showFilters && (
            <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl z-50 p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Document Type</h5>
                <div className="flex flex-wrap gap-2">
                  {['pdf', 'youtube', 'note'].map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? null : type)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                        selectedType === type 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {availableTags.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Topic Tags</h5>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                          selectedTags.includes(tag) 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedType || selectedTags.length > 0) && (
                <button
                  onClick={() => { setSelectedType(null); setSelectedTags([]); }}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
