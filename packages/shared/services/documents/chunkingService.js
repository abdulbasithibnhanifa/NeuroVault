"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkingService = void 0;
const text_splitter_1 = require("langchain/text_splitter");
const logger_1 = require("../../utils/logger");
/**
 * Service for splitting text into manageable chunks for embedding and RAG.
 * Configured with chunkSize: 500 and chunkOverlap: 100 as per requirements.
 */
class ChunkingService {
    splitter;
    constructor(chunkSize = 500, chunkOverlap = 100) {
        this.splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
        });
    }
    /**
     * Splits the input text into chunks.
     * @param text The source text to split.
     * @returns An array of chunks with their index and text content.
     */
    async chunkText(text) {
        try {
            logger_1.logger.info("Starting text chunking", { textLength: text.length });
            const output = await this.splitter.createDocuments([text]);
            const chunks = output.map((doc, index) => ({
                chunkIndex: index,
                text: doc.pageContent,
            }));
            logger_1.logger.info("Text chunking completed", { chunkCount: chunks.length });
            return chunks;
        }
        catch (error) {
            logger_1.logger.error("Error during text chunking", { error: error.message });
            throw error;
        }
    }
}
exports.ChunkingService = ChunkingService;
