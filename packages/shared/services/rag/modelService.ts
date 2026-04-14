import { logger } from "@neurovault/shared/utils/logger";

export interface ModelInfo {
  id: string;
  name: string;
  context_length: number;
  description: string;
}

// Global singletons for caching across the entire application lifecycle
let cachedModels: ModelInfo[] | null = null;
let cachedModelMap: Map<string, ModelInfo> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour for better responsiveness

/**
 * Service to dynamically discover available free models from OpenRouter.
 * Optimized with Singleton pattern and O(1) lookups.
 */
export class ModelService {
  /**
   * Fetches and filters available free models from the OpenRouter API.
   * Caches results for 1 hour to ensure high performance with fresh data.
   */
  async getFreeModels(): Promise<ModelInfo[]> {
    const now = Date.now();
    
    // Performance: Instant return if cache is valid
    if (cachedModels && (now - lastFetchTime < CACHE_DURATION)) {
      return cachedModels;
    }

    try {
      logger.info("ModelService: Fetching live model registry from OpenRouter");
      
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "HTTP-Referer": "https://neurovault.local",
          "X-Title": "NeuroVault",
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const rawData = await response.json();
      
      if (!rawData.data || !Array.isArray(rawData.data)) {
        throw new Error("Invalid model registry format received");
      }

      // Filter for models that are definitely free
      const freeModels: ModelInfo[] = rawData.data
        .filter((model: any) => {
          const pricing = model.pricing;
          if (!pricing) return false;
          const isFree = pricing.prompt === "0" || pricing.prompt === "-1" || model.id === "openrouter/free";
          return isFree && (model.id.endsWith(":free") || model.id.startsWith("openrouter/"));
        })
        .map((model: any) => ({
          id: model.id,
          name: model.name,
          context_length: model.context_length,
          description: model.description
        }));

      // Sort: OpenRouter routers first, then alphabetically
      freeModels.sort((a, b) => {
        if (a.id.startsWith('openrouter/')) return -1;
        if (b.id.startsWith('openrouter/')) return 1;
        return a.name.localeCompare(b.name);
      });

      // Optimization: Build a Map for O(1) lookups
      cachedModelMap = new Map();
      freeModels.forEach(m => cachedModelMap!.set(m.id, m));
      
      logger.info("ModelService: Discovered available free models", { count: freeModels.length });
      
      cachedModels = freeModels;
      lastFetchTime = now;
      
      return freeModels;
    } catch (error: any) {
      logger.error("ModelService Error", { error: error.message });
      
      if (cachedModels) return cachedModels;
      
      // Safety defaults
      const defaults = [
        { id: 'openrouter/free', name: 'Auto-Free Model', context_length: 128000, description: 'Direct from OpenRouter' },
        { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Safe Default)', context_length: 128000, description: 'Stable Backup' }
      ];

      cachedModelMap = new Map();
      defaults.forEach(m => cachedModelMap!.set(m.id, m));
      cachedModels = defaults;
      
      return defaults;
    }
  }

  /**
   * Performance Optimized: O(1) lookup to verify model availability.
   */
  async isModelAvailable(modelId: string): Promise<boolean> {
    // Refresh cache if needed before lookup
    if (!cachedModelMap || (Date.now() - lastFetchTime > CACHE_DURATION)) {
      await this.getFreeModels();
    }
    return cachedModelMap?.has(modelId) || false;
  }
}

// Export singleton instance
export const modelService = new ModelService();
