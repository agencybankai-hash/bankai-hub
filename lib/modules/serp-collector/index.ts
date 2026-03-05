// ═══════════════════════════════════════════════════
// SERP Collector Module — Fetches search results
// ═══════════════════════════════════════════════════

import { AnalysisModule, ModuleMetadata } from "../types";
import { getSerpProvider } from "@/lib/providers/serp";
import { SerpResult } from "@/lib/types";

export interface SerpCollectorInput {
  query: string;
  provider?: string;
  topN?: number;
  language?: string;
  region?: string;
  excludeDomains?: string[];
}

export interface SerpCollectorOutput {
  results: SerpResult[];
  meta: {
    provider: string;
    totalResults: number;
    filteredResults: number;
    processingTime: number;
  };
}

export const serpCollectorMetadata: ModuleMetadata = {
  id: "serp-collector",
  name: "SERP Collector",
  description: "Collects search engine results from various SERP APIs",
  version: "2.0.0",
  author: "Bankai Agency",
  category: "data-source",
  icon: "Search",
};

export class SerpCollectorModule implements AnalysisModule<SerpCollectorInput, SerpCollectorOutput> {
  metadata = serpCollectorMetadata;

  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      // Check if at least one SERP provider is configured
      const xmlriver = getSerpProvider("xmlriver");
      const serpapi = getSerpProvider("serpapi");

      if (!xmlriver.isConfigured() && !serpapi.isConfigured()) {
        errors.push("No SERP provider configured. Set XMLRIVER_USER/KEY or SERPAPI_KEY.");
      }
    } catch (e: any) {
      errors.push(e.message);
    }
    return { valid: errors.length === 0, errors };
  }

  async execute(input: SerpCollectorInput): Promise<SerpCollectorOutput> {
    const startTime = Date.now();
    const providerId = input.provider || "xmlriver";
    const provider = getSerpProvider(providerId);

    let results = await provider.collect({
      query: input.query,
      topN: input.topN || 10,
      language: input.language || "en",
      region: input.region || "us",
    });

    const totalResults = results.length;

    // Apply domain exclusions
    if (input.excludeDomains && input.excludeDomains.length > 0) {
      results = results.filter(
        (r) => !input.excludeDomains!.some((d) => r.url.includes(d))
      );
    }

    // Limit to topN
    results = results.slice(0, input.topN || 10);

    return {
      results,
      meta: {
        provider: providerId,
        totalResults,
        filteredResults: results.length,
        processingTime: Date.now() - startTime,
      },
    };
  }
}
