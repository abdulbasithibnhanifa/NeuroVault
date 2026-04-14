"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const logger_1 = require("../../utils/logger");
/**
 * Service for generating vector embeddings from text.
 * Uses HuggingFace Inference API with sentence-transformers/all-MiniLM-L6-v2.
 * Vector dimension: 384
 */
class EmbeddingService {
    apiKey;
    model = "sentence-transformers/all-MiniLM-L6-v2";
    baseUrl = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";
    constructor() {
        this.apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!this.apiKey) {
            logger_1.logger.error("HUGGINGFACE_API_KEY is not defined in environment variables");
            throw new Error("HUGGINGFACE_API_KEY is missing");
        }
    }
    /**
     * Generates a single embedding for the given text.
     */
    async generateEmbedding(text) {
        const res = await this.generateBatchEmbeddings([text]);
        return res[0];
    }
    /**
     * Generates embeddings for a batch of texts.
     */
    async generateBatchEmbeddings(texts) {
        try {
            logger_1.logger.info("Generating batch embeddings via direct HuggingFace API", { count: texts.length });
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: texts }),
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`HuggingFace Error (${response.status}): ${JSON.stringify(error)}`);
            }
            const outputs = await response.json();
            logger_1.logger.info("Batch embedding generation completed", { count: texts.length });
            return outputs;
        }
        catch (error) {
            logger_1.logger.error("Error generating batch embeddings", { error: error.message });
            throw error;
        }
    }
}
exports.EmbeddingService = EmbeddingService;
