// packages/shared/index.ts

// Config & Env
export * from './config/env';

// Database
export * from './lib/mongodb';
export * from './lib/redis';

// Models
export * from './models/Document';
export * from './models/User';
export * from './models/Chat';
export * from './models/Usage';

// Services
export * from './services/ai/taggingService';
export * from './services/documents/textExtractor';
export * from './services/documents/chunkingService';
export * from './services/embeddings/embeddingService';
export * from './services/embeddings/vectorStore';
export * from './services/storage/s3Service';
export * from './services/documents/youtubeProcessor';
export * from './services/rag/retrievalService';
export * from './services/rag/ragPipeline';
export * from './services/rag/modelService';




// Utils
export * from './utils/logger';
export * from './utils/rateLimiter';
export * from './utils/colors';

// Lib Utilities (for UI)
export * from './lib/utils';

// Types
export * from './types';
