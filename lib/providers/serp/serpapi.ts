// ═══════════════════════════════════════════════════
// SerpAPI SERP Provider
// ═══════════════════════════════════════════════════

import { SerpResult } from "@/lib/types";
import { SerpProvider, SerpQuery } from "./types";

export class SerpApiProvider implements SerpProvider {
  id = "serpapi";
  name = "SerpAPI";

  private get apiKey(): string | undefined {
    return process.env.SERPAPI_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async collect(params: SerpQuery): Promise<SerpResult[]> {
    const apiKey = this.apiKey;
    if (!apiKey) throw new Error("SERPAPI_KEY required");

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("q", params.query);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("num", String(params.topN));
    url.searchParams.set("hl", params.language);
    url.searchParams.set("gl", params.region);

    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
    const data = await resp.json();

    return (data.organic_results || []).map((item: any, i: number) => ({
      position: i + 1,
      url: item.link || "",
      title: item.title || "",
      snippet: item.snippet || "",
    }));
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, message: "SERPAPI_KEY not set" };
    }
    return { healthy: true, message: "SerpAPI configured" };
  }
}
