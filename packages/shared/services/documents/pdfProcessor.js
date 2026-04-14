"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfProcessor = void 0;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const logger_1 = require("@neurovault/shared/utils/logger");
class PdfProcessor {
    /**
     * Extracts text from a PDF file buffer.
     * @param buffer PDF file content
     * @returns Extracted text content
     */
    async extractText(buffer) {
        try {
            logger_1.logger.info('Extracting text from PDF buffer...');
            const data = await (0, pdf_parse_1.default)(buffer);
            logger_1.logger.info(`Text extraction complete. Pages: ${data.numpages}`);
            return data.text;
        }
        catch (error) {
            logger_1.logger.error('PDF extraction error:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }
}
exports.PdfProcessor = PdfProcessor;
