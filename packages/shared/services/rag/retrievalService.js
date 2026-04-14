"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetrievalService = void 0;
const supabase_1 = require("../../lib/supabase");
const embeddingService_1 = require("../embeddings/embeddingService");
const logger_1 = require("../../utils/logger");
/**
 * Service for retrieving relevant document chunks using semantic similarity.
 */
class RetrievalService {
    supabase;
    embeddingService;
    constructor() {
        this.supabase = (0, supabase_1.getSupabaseClient)();
        this.embeddingService = new embeddingService_1.EmbeddingService();
    }
    /**
     * Performs a semantic search for relevant document chunks.
     * @param query The natural language query string.
     * @param userId The ID of the user performing the search (for isolation).
     * @param topK The number of results to retrieve.
     * @returns A promise that resolves to an array of RetrievalResult objects.
     */
    async retrieve(userId, query, topK = 5, similarityThreshold = 0.1, filters) {
        try {
            // 0. Defensive Checks
            if (!userId) {
                logger_1.logger.warn("Retrieval requested without userId, returning empty.");
                return [];
            }
            const trimmedQuery = query?.trim();
            if (!trimmedQuery || trimmedQuery.length < 2) {
                logger_1.logger.info("Query too short or empty, skipping retrieval.", { userId, queryLength: query?.length });
                return [];
            }
            const safeThreshold = typeof similarityThreshold === 'number' ? similarityThreshold : 0.05;
            logger_1.logger.info("Search query received", { userId, queryLength: trimmedQuery.length, topK, similarityThreshold: safeThreshold, filters });
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
                logger_1.logger.error("Error during similarity search RPC", { error: error.message, userId });
                throw error;
            }
            // 3. Transform the results
            let results = (data || []).map((row) => ({
                text: row.text,
                documentId: row.document_id,
                chunkIndex: row.chunk_index,
                similarity: row.similarity,
            }));
            // 4. Apply Filters if present
            if (filters && results.length > 0) {
                // Optimization: Lazy import and connect only when filters are active
                const { DocumentModel } = await Promise.resolve().then(() => __importStar(require('@neurovault/shared/models/Document')));
                const { connectDB } = await Promise.resolve().then(() => __importStar(require('@neurovault/shared/lib/mongodb')));
                await connectDB();
                const docIds = Array.from(new Set(results.map(r => r.documentId)));
                const filteredDocs = await DocumentModel.find({
                    _id: { $in: docIds },
                    ...(filters.type && { type: filters.type }),
                    ...(filters.tags && filters.tags.length > 0 && { tags: { $in: filters.tags } })
                }).select('_id tags type').lean();
                const validDocIds = new Set(filteredDocs.map((d) => d._id.toString()));
                results = results.filter(r => validDocIds.has(r.documentId));
            }
            // Limit back to topK
            results = results.slice(0, topK);
            logger_1.logger.info("Similarity search completed", {
                userId,
                resultCount: results.length,
                topScore: results.length > 0 ? results[0].similarity : null
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error("Error in RetrievalService.retrieve", { error: error.message, userId });
            throw error;
        }
    }
}
exports.RetrievalService = RetrievalService;
