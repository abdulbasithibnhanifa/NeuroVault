import React, { useState, useRef, useEffect } from 'react';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

/**
 * ChatInput Component - Handles user input and submission.
 */
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-8 bg-transparent z-10 transition-all duration-500">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
        {/* Glowing Background Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000" />
        
        <div className="relative flex gap-4 items-end bg-white/60 dark:bg-gray-950/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 p-3 rounded-[2.5rem] shadow-2xl transition-all duration-500 group-focus-within:border-blue-500/50">
          <div className="flex-1 relative flex items-center">
            <div className="pl-4 pr-2 text-gray-400 dark:text-gray-600">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.091 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.454L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
               </svg>
            </div>
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-none rounded-2xl px-2 py-3 focus:ring-0 max-h-[200px] resize-none overflow-y-auto text-[15px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-50 transition-all font-medium"
              placeholder="Transmit neural query..."
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
          </div>
          <button
            type="submit"
            className="group/btn relative bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-2xl p-4 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_8px_16px_-4px_rgba(59,130,246,0.5)] active:scale-90"
            disabled={!inputValue.trim() || disabled}
            aria-label="Send message"
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5 relative z-10"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
