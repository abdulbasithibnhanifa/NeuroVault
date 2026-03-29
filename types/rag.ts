// types/rag.ts
// RAG (Retrieval Augmented Generation) type definitions

export interface EmbeddingRecord {
  id: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  embedding: number[]; // 384-dimensional vector (all-MiniLM-L6-v2)
  metadata: EmbeddingMetadata;
}

export interface EmbeddingMetadata {
  documentTitle: string;
  sourceURL?: string;
  chunkIndex: number;
}

export interface SearchResult {
  text: string;
  similarityScore: number;
  documentTitle: string;
  documentId: string;
  chunkIndex: number;
}

export interface RagDebugInfo {
  queryEmbeddingModel: string;
  retrievedChunks: Array<{
    text: string;
    similarityScore: number;
    source: string;
  }>;
  promptSentToLLM: string;
  totalTokens: number;
}

export interface RagQueryResult {
  answer: string;
  sources: SearchResult[];
  debugInfo?: RagDebugInfo;
}
