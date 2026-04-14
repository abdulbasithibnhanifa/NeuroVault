// config/constants.ts
// Application constants

export const CONSTANTS = {
  // Chunking
  CHUNK_SIZE: 500,         // tokens per chunk
  CHUNK_OVERLAP: 100,      // overlap tokens between chunks

  // Embedding
  EMBEDDING_MODEL: 'sentence-transformers/all-MiniLM-L6-v2',
  EMBEDDING_DIMENSION: 384,

  // Retrieval
  TOP_K_RESULTS: 5,        // number of chunks to retrieve

  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf'],

  // Queue Names
  DOCUMENT_QUEUE: 'document-processing',
  YOUTUBE_QUEUE: 'youtube-processing',
  EMBEDDING_QUEUE: 'embedding-generation',

  // Cache TTL (seconds)
  CACHE_TTL_CHAT: 3600,       // 1 hour
  CACHE_TTL_DOCUMENTS: 300,    // 5 minutes
  CACHE_TTL_SEARCH: 1800,     // 30 minutes

  // Rate Limiting
  RATE_LIMIT_CHAT: 20,        // requests per minute
  RATE_LIMIT_UPLOAD: 10,      // uploads per minute
  RATE_LIMIT_SEARCH: 30,      // searches per minute
};
