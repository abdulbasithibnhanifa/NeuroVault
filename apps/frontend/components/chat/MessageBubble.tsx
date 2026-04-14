import React, { useState } from 'react';
import CitationList from './CitationList';
import { SearchResult } from '@neurovault/shared/types';
import Button from '../ui/Button';

/**
 * Props for the MessageBubble component
 */
interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    citations?: SearchResult[];
  };
  onCitationClick?: (citation: SearchResult) => void;
}

/**
 * MessageBubble Component - Renders individual chat messages with distinct styles for user and assistant.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onCitationClick }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in ${isUser ? 'slide-in-from-right-8' : 'slide-in-from-left-8'} fade-in duration-700 ease-out`}>
      <div
        className={`relative group max-w-[85%] px-7 py-5 rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:scale-[1.01] ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-none border border-white/20 shadow-indigo-500/20'
            : 'bg-white/40 dark:bg-white/5 backdrop-blur-3xl text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/10 rounded-tl-none shadow-black/5'
        }`}
      >
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium tracking-tight">
          {message.content}
        </div>
        
        {!isUser && (
          <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 flex gap-2">
            <button
               onClick={handleCopy}
               className="p-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
               aria-label="Copy to clipboard"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-green-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        )}
        
        {!isUser && message.citations && message.citations.length > 0 && onCitationClick && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
             <CitationList 
                citations={message.citations} 
                onCitationClick={onCitationClick} 
              />
          </div>
        )}

        {/* Status Timestamp (Optional/Visual) */}
        <div className={`mt-3 text-[9px] font-black uppercase tracking-widest ${isUser ? 'text-white/40 text-right' : 'text-gray-400 dark:text-gray-500'}`}>
            {isUser ? 'Transmitted' : 'Neural Echo'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
