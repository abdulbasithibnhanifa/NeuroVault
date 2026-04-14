"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreService = void 0;
const supabase_1 = require("../../lib/supabase");
const logger_1 = require("../../utils/logger");
/**
 * Service for interacting with the Supabase pgvector store.
 */
class VectorStoreService {
    supabase;
    constructor() {
        this.supabase = (0, supabase_1.getSupabaseClient)();
    }
    /**
     * Stores a batch of embeddings and their corresponding text chunks in Supabase.
     * @param documentId The ID of the document.
     * @param userId The ID of the owner user.
     * @param chunks The text chunks.
     * @param embeddings The generated embedding vectors.
     */
    async storeEmbeddings(documentId, userId, chunks, embeddings) {
        try {
            logger_1.logger.info("Starting batch storage of embeddings", {
                documentId,
                userId,
                chunkCount: chunks.length,
            });
            if (chunks.length !== embeddings.length) {
                throw new Error("Mismatch between chunk count and embedding count");
            }
            const rows = chunks.map((chunk, index) => ({
                document_id: documentId,
                user_id: userId,
                chunk_index: chunk.chunkIndex,
                // Sanitize text: remove null bytes and control characters that Postgres hates
                text: chunk.text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, ''),
                embedding: embeddings[index],
                metadata: {
                    documentId,
                    chunkIndex: chunk.chunkIndex,
                },
            }));
            const { error } = await this.supabase
                .from("embeddings")
                .insert(rows);
            if (error) {
                logger_1.logger.error("Failed to store embeddings in Supabase", {
                    error: error.message,
                    documentId,
                });
                throw error;
            }
            logger_1.logger.info("Successfully stored embeddings", {
                documentId,
                chunkCount: chunks.length,
            });
        }
        catch (error) {
            logger_1.logger.error("Error in storeEmbeddings", { error: error.message, documentId });
            throw error;
        }
    }
    /**
     * Placeholder for similarity search (to be implemented later if required)
     */
    async similaritySearch(queryEmbedding, userId, topK = 5) {
        // Note: This would typically call a Supabase RPC function for cosine similarity
        logger_1.logger.warn("similaritySearch called but not fully implemented in this phase");
        throw new Error("Similarity search not implemented");
    }
    /**
     * Deletes all embeddings associated with a specific document.
     * @param documentId The ID of the document to remove.
     */
    async deleteByDocumentId(documentId) {
        try {
            logger_1.logger.info("Deleting embeddings for document", { documentId });
            const { error } = await this.supabase
                .from("embeddings")
                .delete()
                .eq("document_id", documentId);
            if (error) {
                logger_1.logger.error("Failed to delete embeddings", { error: error.message, documentId });
                throw error;
            }
            logger_1.logger.info("Successfully deleted embeddings", { documentId });
        }
        catch (error) {
            logger_1.logger.error("Error in deleteByDocumentId", { error: error.message, documentId });
            throw error;
        }
    }
    async getChunksByDocumentId(documentId) {
        try {
            logger_1.logger.info("Retrieving chunks for document preview", { documentId });
            const { data, error } = await this.supabase
                .from("embeddings")
                .select("text, chunk_index")
                .eq("document_id", documentId)
                .order("chunk_index", { ascending: true });
            if (error) {
                logger_1.logger.error("Failed to fetch chunks from Supabase", { error: error.message, documentId });
                throw error;
            }
            return (data || []).map((row) => row.text);
        }
        catch (error) {
            logger_1.logger.error("Error in getChunksByDocumentId", { error: error.message, documentId });
            throw error;
        }
    }
}
exports.VectorStoreService = VectorStoreService;
