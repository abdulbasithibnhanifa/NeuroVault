"use client";

import React, { useState, useRef, useEffect } from 'react';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useTheme } from 'next-themes';
import { SearchResult } from '@neurovault/shared/types';

/**
 * Message type for internal state
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  citations?: SearchResult[];
}

/**
 * ChatWindow Component - Orchestrates the chat experience.
 */
const ChatWindow: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<SearchResult | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [historyRes, settingsRes] = await Promise.all([
          fetch('/api/chat'),
          fetch('/api/user/settings')
        ]);

        if (historyRes.ok) {
          const history = await historyRes.json();
          const formattedMessages: Message[] = history.map((msg: any, index: number) => ({
            id: `hist-${index}`,
            role: msg.role,
            content: msg.content,
            citations: msg.sources || []
          }));
          setMessages(formattedMessages);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
      } catch (err) {
        console.error('Failed to fetch chat data:', err);
      }
    };
    fetchHistory();
  }, []);

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    // 1. Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Fetch streaming response from API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to fetch streaming response');
      }

      // 3. Add placeholder for assistant response
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant' as const,
        content: '',
        isStreaming: true,
        citations: [],
      }]);
      setIsLoading(false);

      // 4. Read the stream directly (no separate component needed)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let lineBuffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          lineBuffer += chunk;

          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || ''; // keep partial line

          let newText = '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                newText += json.choices?.[0]?.delta?.content || '';
              } catch { /* partial JSON, skip */ }
            }
          }

          if (newText) {
            accumulated += newText;
            const contentSnapshot = accumulated;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content: contentSnapshot }];
              }
              return prev;
            });
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 5. Mark stream as complete
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, isStreaming: false }];
        }
        return prev;
      });

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          return [...prev.slice(0, -1), { ...last, content: `Error: ${errorMessage}`, isStreaming: false }];
        } else if (last && last.role === 'assistant') {
           // If we already had some content, append the error
           return [...prev.slice(0, -1), { ...last, content: `${last.content}\n\n[System Error: ${errorMessage}]`, isStreaming: false }];
        }
        return prev;
      });
      setIsLoading(false);
    }
  };

  const getModelFriendlyName = (modelId: string) => {
    if (!modelId) return "Auto Engine";
    if (modelId === 'openrouter/free') return "Neural Auto-Free";
    if (modelId.includes('llama-3.1-8b')) return "Llama 3.1 8B";
    if (modelId.includes('llama-3.2-3b')) return "Llama 3.2 3B";
    if (modelId.includes('llama-3.3-70b')) return "Llama 3.3 70B";
    if (modelId.includes('gemma-3-27b')) return "Gemma 3 27B";
    if (modelId.includes('mistral-7b')) return "Mistral 7B";
    if (modelId.includes('mistral-small-3.1-24b')) return "Mistral Small 3.1";
    if (modelId.includes('qwen-2.5-72b')) return "Qwen 2.5 72B";
    if (modelId.includes('qwen3-next-80b')) return "Qwen 3 Next 80B";
    if (modelId.includes('deepseek-r1')) return "DeepSeek R1";
    if (modelId === 'openrouter/auto') return "Neural Auto-Exp";
    return modelId.split('/').pop()?.split(':')[0] || modelId;
  };

  const handleCitationClick = (citation: SearchResult) => {
    setSelectedCitation(citation);
  };

  return (
    <div className="flex flex-col h-full bg-transparent max-w-5xl mx-auto overflow-hidden rounded-[2.5rem] transition-colors duration-300">
      {/* Refined Premium Header */}
      <div className="px-8 py-5 flex items-center justify-between border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-black/30 backdrop-blur-3xl z-30 shadow-[0_1px_20px_rgba(0,0,0,0.05)] dark:shadow-none rounded-t-[2.5rem]">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-700" />
            <div className="relative bg-white dark:bg-gray-900 px-2 py-2 rounded-xl border border-white/20 dark:border-gray-800 shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-blue-600 dark:text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-5.25v9" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black text-gray-900 dark:text-gray-50 tracking-tight">NeuroVault</h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-md border border-blue-500/20">
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Core Engine</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Version 4.2.0</span>
              <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-2 px-2 py-0.5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-md border border-indigo-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2 h-2 text-indigo-500">
                  <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                </svg>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {getModelFriendlyName(settings?.defaultModel)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end border-r border-gray-100 dark:border-white/5 pr-6">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Temporal Filter</span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">7-Day Retention</span>
          </div>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-xl border border-gray-100 dark:border-white/10 transition-all duration-300 group shadow-sm hover:shadow-md"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-yellow-400 group-hover:rotate-45 transition-transform duration-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-500 group-hover:-rotate-12 transition-transform duration-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>
      </div>
  
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-10 space-y-8 scroll-smooth custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in fade-in zoom-in duration-1000">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
              <div className="relative bg-white/50 dark:bg-white/5 backdrop-blur-3xl p-10 rounded-[40px] border border-white/20 dark:border-white/10 shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-blue-600 dark:text-blue-400 mx-auto">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
                </svg>
                <div className="mt-8 space-y-2">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter">Vault Engine Ready</h3>
                    <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">Initiate a semantic query to begin neural retrieval across your encrypted data vault.</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-xl">
                {['Summarize my recent research', 'What are the core concept in my notes?', 'List all action items'].map(text => (
                    <button 
                        key={text}
                        onClick={() => handleSendMessage(text)}
                        className="px-5 py-2.5 bg-white/50 dark:bg-white/5 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all rounded-full border border-gray-100 dark:border-white/10 shadow-sm text-xs font-bold text-gray-600 dark:text-gray-400"
                    >
                        {text}
                    </button>
                ))}
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onCitationClick={handleCitationClick} 
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-8 animate-in slide-in-from-left-4 duration-500">
            <div className="relative bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 p-6 rounded-[32px] rounded-tl-none shadow-xl flex gap-3 items-center">
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 animate-pulse">Neural Pathfinding...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />

      {/* Source Preview Modal */}
      <Modal
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        title="Source Preview"
      >
        {selectedCitation && (
          <div className="space-y-6">
            <div className="animate-in slide-in-from-left duration-300">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-1">Authenticated Document</label>
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedCitation.documentTitle || 'Untitled Document'}</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] block mb-2">Chunk Reference</label>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">#{selectedCitation.chunkIndex}</span>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] block mb-2">Confidence Score</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${selectedCitation.similarityScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{(selectedCitation.similarityScore * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="animate-in slide-in-from-bottom duration-500">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-3">Retrieved Content</label>
              <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/50 text-[15px] leading-relaxed text-gray-700 dark:text-gray-200 italic shadow-sm">
                &quot;{selectedCitation.text}&quot;
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChatWindow;
