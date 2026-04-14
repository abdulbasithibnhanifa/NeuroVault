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
exports.YoutubeProcessor = void 0;
const youtube_transcript_1 = require("youtube-transcript");
const logger_1 = require("@neurovault/shared/utils/logger");
class YoutubeProcessor {
    /**
     * Fetches video metadata (title) using the YouTube oEmbed API.
     * @param youtubeUrl Full YouTube URL
     */
    async getVideoTitle(youtubeUrl) {
        try {
            logger_1.logger.info(`Fetching YouTube title via oEmbed for: ${youtubeUrl}`);
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
            if (response.ok) {
                const data = await response.json();
                return data.title || null;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.warn('Failed to fetch YouTube title via oEmbed', { url: youtubeUrl, error: error.message });
            return null;
        }
    }
    /**
     * Extracts transcript from a YouTube video URL using multiple methods for robustness.
     * @param youtubeUrl Full YouTube URL
     * @returns Extracted transcript text
     */
    async extractTranscript(youtubeUrl) {
        const videoId = this.extractVideoId(youtubeUrl);
        if (!videoId) {
            throw new Error('Invalid YouTube URL: Could not extract Video ID');
        }
        logger_1.logger.info(`Starting transcript extraction for video: ${videoId}`);
        // Attempt 1: yt-caption-kit (More modern, handles more cases)
        try {
            logger_1.logger.info(`Attempting extraction with yt-caption-kit for ${videoId}`);
            // Dynamic import to handle pure ESM package in commonjs context
            const { YtCaptionKit } = await Promise.resolve().then(() => __importStar(require('yt-caption-kit')));
            const captionKit = new YtCaptionKit();
            const transcript = await captionKit.fetch(videoId, {
                languages: ['en', 'en-US', 'en-GB'],
            });
            if (transcript && transcript.snippets && transcript.snippets.length > 0) {
                const fullText = transcript.snippets
                    .map((item) => item.text)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (fullText.length > 0) {
                    logger_1.logger.info(`Successfully extracted transcript with yt-caption-kit (${fullText.length} chars)`);
                    return fullText;
                }
            }
        }
        catch (error) {
            logger_1.logger.warn(`yt-caption-kit failed for ${videoId}: ${error.message}`);
        }
        // Attempt 2: youtube-transcript (Fallback)
        try {
            logger_1.logger.info(`Attempting fallback extraction with youtube-transcript for ${videoId}`);
            const transcriptData = await youtube_transcript_1.YoutubeTranscript.fetchTranscript(videoId);
            if (transcriptData && transcriptData.length > 0) {
                const fullText = transcriptData
                    .map((item) => item.text)
                    .join(' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (fullText.length > 0) {
                    logger_1.logger.info(`Successfully extracted transcript with youtube-transcript (${fullText.length} chars)`);
                    return fullText;
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`youtube-transcript fallback failed for ${videoId}: ${error.message}`);
        }
        throw new Error('Could not retrieve transcript. Captions may be disabled or the video is unavailable.');
    }
    /**
     * Helper to parse Video ID from various YouTube URL formats
     */
    extractVideoId(url) {
        // Robust regex to handle standard, share, shorts, embed, and live URLs
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
}
exports.YoutubeProcessor = YoutubeProcessor;
