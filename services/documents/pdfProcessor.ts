import pdf from 'pdf-parse';
import { logger } from '@/utils/logger';

export class PdfProcessor {
  /**
   * Extracts text from a PDF file buffer.
   * @param buffer PDF file content
   * @returns Extracted text content
   */
  async extractText(buffer: Buffer): Promise<string> {
    try {
      logger.info('Extracting text from PDF buffer...');
      const data = await pdf(buffer);
      logger.info(`Text extraction complete. Pages: ${data.numpages}`);
      return data.text;
    } catch (error) {
      logger.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
}
