// ═══════════════════════════════════════════════════
// SERP Provider Types
// ═══════════════════════════════════════════════════

import { SerpResult } from "@/lib/types";

export interface SerpQuery {
  query: string;
  topN: number;
  language: string;
  region: string;
}

export interface SerpProvider {
  id: string;
  name: string;

  /** Check if provider is configured */
  isConfigured(): boolean;

  /** Collect SERP results */
  collect(params: SerpQuery): Promise<SerpResult[]>;

  /** Health check */
  healthCheck(): Promise<{ healthy: boolean; message: string }>;
}
