import { logger } from "@/utils/logger";
import { connectDB } from "@/lib/mongodb";
import { Usage } from "@/models/Usage";

/**
 * Service for automatically generating topic tags and summaries for documents using AI.
 */
export class TaggingService {
  private openRouterKey: string | undefined;

  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
  }

  /**
   * Generates document analysis (tags and summary) and tracks LLM usage.
   */
  async generateAnalysis(text: string, userId: string): Promise<{ tags: string[], summary: string }> {
    try {
      if (!this.openRouterKey) {
        logger.warn("OPENROUTER_API_KEY is missing, skipping auto-analysis");
        return { tags: [], summary: "" };
      }

      const contentSnippet = text.substring(0, 10000); 
      const model = "google/gemini-2.0-flash-001";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.openRouterKey}`,
          "HTTP-Referer": "https://neurovault.local",
          "X-Title": "NeuroVault",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `You are a world-class documentation specialist. 
              Extract exactly 3-5 specific, concise topic tags and a clear 3-sentence summary of the provided text.
              Return ONLY a clean JSON object: {"summary": "string", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}`
            },
            { role: "user", content: contentSnippet }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        logger.error("Analysis service API error", { status: response.status });
        return { tags: [], summary: "" };
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      // 1. Track Usage
      const tokens = data.usage?.total_tokens || 0;
      if (tokens > 0) {
        try {
          await connectDB();
          await Usage.create({ userId, tokens, aiModel: model, type: 'summarization' });
        } catch (dbErr) {
          logger.error("Failed to save usage", { error: dbErr });
        }
      }

      let analysis = { tags: [], summary: "" };
      if (content) {
        try {
          let jsonStr = content.trim();
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
          const parsed = JSON.parse(jsonStr);
          analysis = {
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
            summary: typeof parsed.summary === 'string' ? parsed.summary : ""
          };
        } catch (err) {
          logger.error("JSON Parse Error in TaggingService");
        }
      }

      let cleanTags = (analysis.tags || [])
        .map((t: any) => String(t).toLowerCase().trim().replace(/[^a-z0-9 \-_]/g, '').replace(/\s+/g, '-')) 
        .filter((t: string) => t.length > 1 && t.length < 25)
        .slice(0, 5); // Ensure no more than 5 tags

      logger.info(`Generated ${cleanTags.length} clean tags: [${cleanTags.join(', ')}]`);

      // --- AGGRESSIVE FALLBACK ---
      if (cleanTags.length === 0) {
        logger.warn("AI returned zero tags. Using forced fallback from content...");
        // Split text/title into words and find meaningful ones
        const combined = (text.substring(0, 1000)).toLowerCase();
        const commonWords = ['research', 'report', 'video', 'note', 'tech', 'data', 'document', 'project', 'info', 'vault', 'meeting', 'guide'];
        cleanTags = commonWords.filter(w => combined.includes(w)).slice(0, 4);
        
        if (cleanTags.length === 0) {
          // If still no keywords, just use the document type
          cleanTags = ['general', 'vault-document'];
        }
        logger.info(`Fallback tags generated: [${cleanTags.join(', ')}]`);
      }

      return { tags: cleanTags, summary: analysis.summary };

    } catch (error: any) {
      logger.error("Analysis service failed", { error: error.message });
      return { tags: [], summary: "" };
    }
  }
}
