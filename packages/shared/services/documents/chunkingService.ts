import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { logger } from "../../utils/logger";
import { DocumentChunk } from "../../types/document";

/**
 * Service for splitting text into manageable chunks for embedding and RAG.
 * Configured with chunkSize: 500 and chunkOverlap: 100 as per requirements.
 */
export class ChunkingService {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(chunkSize: number = 500, chunkOverlap: number = 100) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });
  }

  /**
   * Splits the input text into chunks.
   * @param text The source text to split.
   * @returns An array of chunks with their index and text content.
   */
  async chunkText(text: string): Promise<DocumentChunk[]> {
    try {
      logger.info("Starting text chunking", { textLength: text.length });

      const output = await this.splitter.createDocuments([text]);

      const chunks: DocumentChunk[] = output.map((doc, index) => ({
        chunkIndex: index,
        text: doc.pageContent,
      }));

      logger.info("Text chunking completed", { chunkCount: chunks.length });

      return chunks;
    } catch (error: any) {
      logger.error("Error during text chunking", { error: error.message });
      throw error;
    }
  }
}
