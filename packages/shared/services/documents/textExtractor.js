"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextExtractor = void 0;
const pdfProcessor_1 = require("./pdfProcessor");
const youtubeProcessor_1 = require("./youtubeProcessor");
const logger_1 = require("@neurovault/shared/utils/logger");
class TextExtractor {
    pdfProcessor;
    youtubeProcessor;
    constructor() {
        this.pdfProcessor = new pdfProcessor_1.PdfProcessor();
        this.youtubeProcessor = new youtubeProcessor_1.YoutubeProcessor();
    }
    /**
     * Unified text extraction method.
     * @param documentType 'pdf' | 'youtube' | 'note'
     * @param source Buffer (for PDFs) or string (for YouTube URLs)
     * @returns Extracted and sanitized text
     */
    async extract(documentType, source) {
        try {
            logger_1.logger.info(`Extracting text for document type: ${documentType}`);
            let text = '';
            if (documentType === 'pdf' && Buffer.isBuffer(source)) {
                text = await this.pdfProcessor.extractText(source);
            }
            else if (documentType === 'youtube' && typeof source === 'string') {
                text = await this.youtubeProcessor.extractTranscript(source);
            }
            else if (documentType === 'note' && typeof source === 'string') {
                text = source;
            }
            else {
                throw new Error(`Unsupported document type or source format: ${documentType}`);
            }
            // Basic sanitization
            return text.trim();
        }
        catch (error) {
            logger_1.logger.error('Text extraction failed', { type: documentType, error: error.message });
            throw error;
        }
    }
}
exports.TextExtractor = TextExtractor;
