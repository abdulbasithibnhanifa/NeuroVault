import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../lib/supabase";
import { EmbeddingService } from "../embeddings/embeddingService";
import { logger } from "../../utils/logger";

/**
 * Interface for a retrieved document chunk
 */
export interface RetrievalResult {
  text: string;
  documentId: string;
  chunkIndex: number;
  similarity: number;
}

/**
 * Service for retrieving relevant document chunks using semantic similarity.
 */
export class RetrievalService {
  private supabase: SupabaseClient;
  private embeddingService: EmbeddingService;

  constructor() {
    this.supabase = getSupabaseClient();
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Performs a semantic search for relevant document chunks.
   * @param query The natural language query string.
   * @param userId The ID of the user performing the search (for isolation).
   * @param topK The number of results to retrieve.
   * @returns A promise that resolves to an array of RetrievalResult objects.
   */
  async retrieve(
    userId: string,
    query: string,
    topK: number = 5,
    similarityThreshold: number = 0.1,
    filters?: {
      type?: 'pdf' | 'note' | 'youtube';
      tags?: string[];
    }
  ): Promise<RetrievalResult[]> {
    try {
      // 0. Defensive Checks
      if (!userId) {
        logger.warn("Retrieval requested without userId, returning empty.");
        return [];
      }

      const trimmedQuery = query?.trim();
      if (!trimmedQuery || trimmedQuery.length < 2) {
        logger.info("Query too short or empty, skipping retrieval.", { userId, queryLength: query?.length });
        return [];
      }

      const safeThreshold = typeof similarityThreshold === 'number' ? similarityThreshold : 0.05;

      logger.info("Search query received", { userId, queryLength: trimmedQuery.length, topK, similarityThreshold: safeThreshold, filters });

      // 1. Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(trimmedQuery);

      // 2. Perform similarity search in Supabase using the match_embeddings RPC
      // We retrieve significantly more (topK * 10) to allow room for diverse context
      const searchLimit = filters ? topK * 10 : topK * 4;

      const { data, error } = await this.supabase.rpc("match_embeddings", {
        query_embedding: queryEmbedding,
        match_threshold: safeThreshold,
        match_count: searchLimit,
        filter_user_id: userId,
      });

      if (error) {
        logger.error("Error during similarity search RPC", { error: error.message, userId });
        throw error;
      }

      // 3. Transform the results
      let results: RetrievalResult[] = (data || []).map((row: any) => ({
        text: row.text,
        documentId: row.document_id,
        chunkIndex: row.chunk_index,
        similarity: row.similarity,
      }));

      // 4. Apply Filters if present
      if (filters && results.length > 0) {
        // Optimization: Lazy import and connect only when filters are active
        const { DocumentModel } = await import('@/models/Document');
        const { connectDB } = await import('@/lib/mongodb');
        await connectDB();

        const docIds = Array.from(new Set(results.map(r => r.documentId)));
        const filteredDocs = await DocumentModel.find({
          _id: { $in: docIds },
          ...(filters.type && { type: filters.type }),
          ...(filters.tags && filters.tags.length > 0 && { tags: { $in: filters.tags } })
        }).select('_id tags type').lean();
        const validDocIds = new Set(filteredDocs.map((d: any) => d._id.toString()));

        results = results.filter(r => validDocIds.has(r.documentId));
      }

      // Limit back to topK
      results = results.slice(0, topK);

      logger.info("Similarity search completed", { 
        userId, 
        resultCount: results.length,
        topScore: results.length > 0 ? results[0].similarity : null
      });

      return results;
    } catch (error: any) {
      logger.error("Error in RetrievalService.retrieve", { error: error.message, userId });
      throw error;
    }
  }
}
