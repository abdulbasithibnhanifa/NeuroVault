import { logger } from "../../utils/logger";

/**
 * Service for generating vector embeddings from text.
 * Uses HuggingFace Inference API with sentence-transformers/all-MiniLM-L6-v2.
 * Vector dimension: 384
 */
export class EmbeddingService {
  private apiKey: string;
  private model: string = "sentence-transformers/all-MiniLM-L6-v2";
  private baseUrl: string = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY as string;
    
    if (!this.apiKey) {
      logger.error("HUGGINGFACE_API_KEY is not defined in environment variables");
      throw new Error("HUGGINGFACE_API_KEY is missing");
    }
  }

  /**
   * Generates a single embedding for the given text.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const res = await this.generateBatchEmbeddings([text]);
    return res[0];
  }

  /**
   * Generates embeddings for a batch of texts.
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      logger.info("Generating batch embeddings via direct HuggingFace API", { count: texts.length });
      
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
      
      logger.info("Batch embedding generation completed", { count: texts.length });
      return outputs as number[][];
    } catch (error: any) {
      logger.error("Error generating batch embeddings", { error: error.message });
      throw error;
    }
  }
}
