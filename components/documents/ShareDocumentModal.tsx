"use client";

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { logger } from '@/utils/logger';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

/**
 * ShareDocumentModal - Allows sharing a document with another user via email.
 */
export default function ShareDocumentModal({
  isOpen,
  onClose,
  documentId,
  documentTitle,
}: ShareDocumentModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/documents/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, targetUserEmail: email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share document');
      }

      setSuccess(true);
      setEmail('');
      logger.info(`Successfully shared document ${documentId} with ${email}`);
    } catch (err: any) {
      setError(err.message);
      logger.error('Sharing error', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Document">
      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] block mb-1">
            Sharing Access For
          </label>
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
            {documentTitle}
          </h4>
        </div>

        {success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="bg-green-500 rounded-full p-1 text-white text-[10px]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-bold text-green-700 dark:text-green-400">
              Access granted successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">
                Recipient Email
              </label>
              <input
                type="email"
                required
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>

            {error && (
              <div className="text-xs font-bold text-red-500 ml-1 animate-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              variant="primary"
              className="w-full rounded-2xl py-3 text-sm"
            >
              Grant Access
            </Button>
          </form>
        )}

        <div className="pt-4 flex justify-end">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400">
            {success ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
