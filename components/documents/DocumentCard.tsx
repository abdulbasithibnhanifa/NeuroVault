"use client";

import React, { useState } from 'react';
import { IDocument } from '@/types/document';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import ShareDocumentModal from './ShareDocumentModal';
import DocumentEditModal from './DocumentEditModal';
import { stringToColor, stringToRGBA } from '@/utils/colors';

interface DocumentCardProps {
  document: IDocument;
  onDelete?: (id: string) => void;
  onClick?: (document: IDocument) => void;
  onUpdate?: (updatedDoc: IDocument) => void;
}

/**
 * DocumentCard Component - Displays document metadata in a premium card format.
 * Features deterministic tag coloring and a mesh-gradient aesthetic.
 */
export default function DocumentCard({ document, onDelete, onClick, onUpdate }: DocumentCardProps) {
  const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = session?.user?.id === document.userId;

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmingDelete) {
      setIsDeleting(true);
      if (onDelete) await onDelete(String(document._id || (document as any).id));
      setIsDeleting(false);
      setConfirmingDelete(false);
    } else {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
    }
  };

  const typeIcons = {
    pdf: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    youtube: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
      </svg>
    ),
    note: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  };

  return (
    <>
      <div 
        onClick={() => onClick?.(document)}
        className="group relative bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98] overflow-hidden"
      >
        {/* Background Mesh */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150" />

        <div className="flex flex-col h-full space-y-4">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
              {typeIcons[document.type]}
            </div>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsShareOpen(true); }}
                className="p-2 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md transition-colors text-gray-400 hover:text-green-500"
                title="Share Document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0-10.628a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5zm0 10.628a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" />
                </svg>
              </button>

              {isOwner && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                  className="p-2 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md transition-colors text-gray-400 hover:text-blue-500"
                  title="Edit Metadata"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}

              <button 
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className={`p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-md transition-all group/del flex items-center gap-1 ${confirmingDelete ? 'bg-red-500 border-red-500 text-white' : 'text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'}`}
                title={isOwner ? 'Delete' : 'Remove'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${isDeleting ? 'animate-spin' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                {confirmingDelete && <span className="text-[9px] font-black uppercase tracking-tighter pr-1">Confirm</span>}
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
              {document.title}
            </h3>
            
            {document.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                {document.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {!isOwner && (
                <span className="px-2 py-1 text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-lg border border-orange-200 dark:border-orange-800">
                  Shared
                </span>
              )}
              {document.tags && document.tags.slice(0, 3).map((tag) => {
                const isDark = resolvedTheme === 'dark';
                const color = stringToColor(tag, isDark);
                const bg = stringToRGBA(tag, 0.1, isDark);
                return (
                  <span 
                    key={tag} 
                    className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all hover:scale-105"
                    style={{ 
                      color: color, 
                      backgroundColor: bg,
                      borderColor: stringToRGBA(tag, 0.2, isDark)
                    }}
                  >
                    #{tag}
                  </span>
                );
              })}
              {document.tags && document.tags.length > 3 && (
                <span className="px-2.5 py-1 text-[11px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  +{document.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              {format(new Date(document.createdAt), 'MMM d, yyyy')}
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                document.status === 'indexed' || document.status === 'analyzed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                document.status === 'failed' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500 animate-pulse'
              }`} />
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                {document.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ShareDocumentModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={String(document._id || (document as any).id)}
        documentTitle={document.title}
      />
      
      <DocumentEditModal
        key={`edit-${document._id}`}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        documentId={String(document._id || (document as any).id)}
        initialTitle={document.title}
        initialTags={document.tags || []}
        initialSuggestedTags={document.suggestedTags || []}
        initialDescription={document.description}
        onUpdate={onUpdate!}
      />
    </>
  );
}
