// ═══════════════════════════════════════════════════
// Relevance Cloud Module — Core analysis module
// ═══════════════════════════════════════════════════

import { AnalysisModule, ModuleMetadata } from "../types";
import { getDefaultLLMProvider } from "@/lib/providers/llm";
import { PageContent, RelevanceCloud, Entity } from "@/lib/types";
import { buildExtractionPrompt, getSystemPrompt, parseCloudResponse, prepareContentForLLM } from "./prompts";

export interface RelevanceCloudInput {
  query: string;
  pages: PageContent[];
}

export interface RelevanceCloudOutput {
  cloud: RelevanceCloud;
  meta: {
    pagesAnalyzed: number;
    llmProvider: string;
    processingTime: number;
  };
}

export const relevanceCloudMetadata: ModuleMetadata = {
  id: "relevance-cloud",
  name: "Relevance Cloud Builder",
  description: "Builds a relevance cloud from TOP SERP content using LLM entity extraction",
  version: "2.0.0",
  author: "Bankai Agency",
  category: "analysis",
  icon: "Cloud",
  requiredEnvVars: ["ANTHROPIC_API_KEY"],
};

export class RelevanceCloudModule implements AnalysisModule<RelevanceCloudInput, RelevanceCloudOutput> {
  metadata = relevanceCloudMetadata;

  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      const provider = getDefaultLLMProvider();
      if (!provider.isConfigured()) {
        errors.push("No LLM provider configured");
      }
    } catch (e: any) {
      errors.push(e.message);
    }
    return { valid: errors.length === 0, errors };
  }

  async execute(input: RelevanceCloudInput): Promise<RelevanceCloudOutput> {
    const startTime = Date.now();
    const provider = getDefaultLLMProvider();

    const combinedContent = prepareContentForLLM(input.pages);
    const systemPrompt = getSystemPrompt();
    const extractionPrompt = buildExtractionPrompt(input.query, combinedContent);

    const response = await provider.complete(systemPrompt, extractionPrompt);
    const cloud = parseCloudResponse(input.query, response.text);

    return {
      cloud,
      meta: {
        pagesAnalyzed: input.pages.length,
        llmProvider: provider.id,
        processingTime: Date.now() - startTime,
      },
    };
  }
}
