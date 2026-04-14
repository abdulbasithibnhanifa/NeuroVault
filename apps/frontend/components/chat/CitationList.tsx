import React from 'react';
import { SearchResult } from '@neurovault/shared/types';

interface CitationListProps {
  citations: SearchResult[];
  onCitationClick: (citation: SearchResult) => void;
}

/**
 * CitationList Component - Displays a subtle list of sources for a chat message.
 */
const CitationList: React.FC<CitationListProps> = ({ citations, onCitationClick }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          className="w-4 h-4 text-blue-500 dark:text-blue-400"
        >
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
        </svg>
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Sources & Citations</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {citations.map((citation, index) => (
          <li key={index}>
            <button
              onClick={() => onCitationClick(citation)}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
            >
              <span className="flex items-center justify-center w-4 h-4 bg-gray-200 dark:bg-gray-700 group-hover:bg-blue-600 group-hover:text-white rounded text-[10px] font-bold transition-colors">
                {index + 1}
              </span>
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate max-w-[150px]">
                {citation.documentTitle || 'Untitled Document'}
              </span>
              <span className="text-[9px] text-gray-400 group-hover:text-blue-400">
                (ch {citation.chunkIndex})
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CitationList;
