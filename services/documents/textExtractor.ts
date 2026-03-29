import { PdfProcessor } from './pdfProcessor';
import { YoutubeProcessor } from './youtubeProcessor';
import { logger } from '@/utils/logger';

export class TextExtractor {
  private pdfProcessor: PdfProcessor;
  private youtubeProcessor: YoutubeProcessor;

  constructor() {
    this.pdfProcessor = new PdfProcessor();
    this.youtubeProcessor = new YoutubeProcessor();
  }

  /**
   * Unified text extraction method.
   * @param documentType 'pdf' | 'youtube' | 'note'
   * @param source Buffer (for PDFs) or string (for YouTube URLs)
   * @returns Extracted and sanitized text
   */
  async extract(documentType: string, source: Buffer | string): Promise<string> {
    try {
      logger.info(`Extracting text for document type: ${documentType}`);
      
      let text = '';

      if (documentType === 'pdf' && Buffer.isBuffer(source)) {
        text = await this.pdfProcessor.extractText(source);
      } else if (documentType === 'youtube' && typeof source === 'string') {
        text = await this.youtubeProcessor.extractTranscript(source);
      } else if (documentType === 'note' && typeof source === 'string') {
        text = source;
      } else {
        throw new Error(`Unsupported document type or source format: ${documentType}`);
      }

      // Basic sanitization
      return text.trim();
    } catch (error: any) {
      logger.error('Text extraction failed', { type: documentType, error: error.message });
      throw error;
    }
  }
}
