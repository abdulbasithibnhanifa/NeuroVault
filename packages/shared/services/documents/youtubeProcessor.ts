import { YoutubeTranscript } from 'youtube-transcript';
import { logger } from '@neurovault/shared/utils/logger';

export class YoutubeProcessor {
  /**
   * Fetches video metadata (title) using the YouTube oEmbed API.
   * @param youtubeUrl Full YouTube URL
   */
  async getVideoTitle(youtubeUrl: string): Promise<string | null> {
    try {
      logger.info(`Fetching YouTube title via oEmbed for: ${youtubeUrl}`);
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
      if (response.ok) {
        const data = await response.json();
        return data.title || null;
      }
      return null;
    } catch (error: any) {
      logger.warn('Failed to fetch YouTube title via oEmbed', { url: youtubeUrl, error: error.message });
      return null;
    }
  }

  /**
   * Extracts transcript from a YouTube video URL using multiple methods for robustness.
   * @param youtubeUrl Full YouTube URL
   * @returns Extracted transcript text
   */
  async extractTranscript(youtubeUrl: string): Promise<string> {
    const videoId = this.extractVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL: Could not extract Video ID');
    }

    logger.info(`Starting transcript extraction for video: ${videoId}`);

    // Attempt 1: yt-caption-kit (More modern, handles more cases)
    try {
      logger.info(`Attempting extraction with yt-caption-kit for ${videoId}`);
      
      // Dynamic import to handle pure ESM package in commonjs context
      const { YtCaptionKit } = await import('yt-caption-kit');
      const captionKit = new YtCaptionKit();
      
      const transcript = await captionKit.fetch(videoId, {
        languages: ['en', 'en-US', 'en-GB'],
      });

      if (transcript && transcript.snippets && transcript.snippets.length > 0) {
        const fullText = transcript.snippets
          .map((item: any) => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (fullText.length > 0) {
          logger.info(`Successfully extracted transcript with yt-caption-kit (${fullText.length} chars)`);
          return fullText;
        }
      }
    } catch (error: any) {
      logger.warn(`yt-caption-kit failed for ${videoId}: ${error.message}`);
    }

    // Attempt 2: youtube-transcript (Fallback)
    try {
      logger.info(`Attempting fallback extraction with youtube-transcript for ${videoId}`);
      const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (transcriptData && transcriptData.length > 0) {
        const fullText = transcriptData
          .map((item: any) => item.text)
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
          logger.info(`Successfully extracted transcript with youtube-transcript (${fullText.length} chars)`);
          return fullText;
        }
      }
    } catch (error: any) {
      logger.error(`youtube-transcript fallback failed for ${videoId}: ${error.message}`);
    }

    throw new Error('Could not retrieve transcript. Captions may be disabled or the video is unavailable.');
  }

  /**
   * Helper to parse Video ID from various YouTube URL formats
   */
  private extractVideoId(url: string): string | null {
    // Robust regex to handle standard, share, shorts, embed, and live URLs
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
