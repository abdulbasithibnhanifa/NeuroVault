"use client";

import React, { useState, useEffect } from 'react';
import DocumentCard from './DocumentCard';
import DocumentPreviewModal from './DocumentPreviewModal';
import { IDocument } from '@/types/document';

interface DocumentListProps {
  searchTerm: string;
  filters?: {
    type?: string;
    tags?: string[];
  };
}

/**
 * DocumentList Component - Manages and displays a grid of documents.
 */
export default function DocumentList({ searchTerm, filters }: DocumentListProps) {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<IDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const buildUrl = React.useCallback((baseUrl: string) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
    return `${baseUrl}?${params.toString()}`;
  }, [searchTerm, filters?.type, filters?.tags]);

  const fetchDocumentContent = async (id: string) => {
    try {
      const response = await fetch(`/api/documents?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch preview content');
      const data = await response.json();
      setPreviewContent(data.fullText || data.document?.content || 'No content available for preview.');
    } catch (err: any) {
      console.error('Preview error:', err);
      setPreviewContent('Unable to load document content at this time.');
    }
  };

  const handleDocumentClick = async (doc: IDocument) => {
    setSelectedDocument(doc);
    setPreviewContent('');
    setIsPreviewOpen(true);
    await fetchDocumentContent(String(doc._id || (doc as any).id));
  };

  // Real-time status polling for processing documents
  useEffect(() => {
    const hasProcessingDocs = documents.some(doc => 
      ['uploaded', 'processing'].includes(doc.status)
    );

    if (!hasProcessingDocs) return;

    const intervalId = setInterval(async () => {
      try {
        const url = buildUrl('/api/documents');
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const currentStatuses = documents.map(d => d.status).join(',');
          const newStatuses = data.map((d: IDocument) => d.status).join(',');
          
          if (currentStatuses !== newStatuses) {
            setDocuments(data);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [documents, buildUrl]);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = buildUrl('/api/documents');
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch documents');
        const data = await response.json();
        setDocuments(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [buildUrl]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => String(doc._id || (doc as any).id) !== id));
      } else {
        const body = await response.json().catch(() => ({}));
        alert(`Failed to delete: ${body.error || response.statusText}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-900 h-64 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 px-4 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
        <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          Retry
        </button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-32 px-4 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
        <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {searchTerm ? 'No matching documents found' : 'Your vault is empty'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          {searchTerm 
            ? `Try adjusting your search for "${searchTerm}" or upload a new file.` 
            : 'Start by uploading your first PDF document to build your knowledge base.'}
        </p>
      </div>
    );
  }

  const handleUpdate = (updatedDoc: IDocument) => {
    setDocuments(prev => prev.map(doc => 
      String(doc._id || (doc as any).id) === String(updatedDoc._id || (updatedDoc as any).id) ? updatedDoc : doc
    ));
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {documents.map((doc) => (
          <DocumentCard 
            key={String(doc._id || (doc as any).id)} 
            document={doc} 
            onDelete={handleDelete} 
            onClick={handleDocumentClick}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      {selectedDocument && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={selectedDocument.title}
          content={previewContent}
          searchQuery={searchTerm}
        />
      )}
    </>
  );
}
