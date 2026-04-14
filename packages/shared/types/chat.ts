// types/chat.ts
// Chat type definitions

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  sources?: SourceCitation[];
  timestamp: Date;
}

export interface SourceCitation {
  documentTitle: string;
  chunkIndex: number;
  similarityScore: number;
  snippet: string;
}

export interface ChatSession {
  _id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface ChatRequest {
  message: string;
  chatId?: string;
}

export interface ChatResponse {
  reply: string;
  sources: SourceCitation[];
  chatId: string;
}
