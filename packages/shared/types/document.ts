// types/document.ts
// Document type definitions

export type DocumentStatus = 'uploaded' | 'processing' | 'processed' | 'indexed' | 'analyzed' | 'failed';
export type DocumentType = 'pdf' | 'note' | 'youtube';

export interface IDocument {
  _id: string;
  userId: string;
  title: string;
  originalFilename?: string;
  type: DocumentType;
  s3Url: string;
  status: DocumentStatus;
  chunkCount: number;
  sharedWith: string[];
  tags: string[];
  suggestedTags: string[];
  description?: string;
  createdAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  metadata: {
    documentTitle: string;
    sourceURL?: string;
    chunkIndex: number;
  };
}

export interface UploadRequest {
  file?: File;
  youtubeUrl?: string;
  title: string;
  type: DocumentType;
}
