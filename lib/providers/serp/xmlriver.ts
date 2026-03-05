// ═══════════════════════════════════════════════════
// XMLRiver SERP Provider
// ═══════════════════════════════════════════════════

import { SerpResult } from "@/lib/types";
import { SerpProvider, SerpQuery } from "./types";

export class XmlriverProvider implements SerpProvider {
  id = "xmlriver";
  name = "XMLRiver";

  private get user(): string | undefined {
    return process.env.XMLRIVER_USER;
  }

  private get key(): string | undefined {
    return process.env.XMLRIVER_KEY;
  }

  isConfigured(): boolean {
    return !!(this.user && this.key);
  }

  async collect(params: SerpQuery): Promise<SerpResult[]> {
    const user = this.user;
    const key = this.key;
    if (!user || !key) throw new Error("XMLRIVER_USER and XMLRIVER_KEY required");

    const domainMap: Record<string, string> = {
      us: "1", uk: "2", de: "3", fr: "4", es: "5", ru: "2", com: "1",
    };
    const countryMap: Record<string, string> = {
      us: "2840", uk: "2826", de: "2276", fr: "2250",
      es: "2724", ru: "2643", kz: "2398",
    };
    const langMap: Record<string, string> = {
      en: "EN", ru: "RU", de: "DE", fr: "FR", es: "ES",
    };

    const url = new URL("https://xmlriver.com/search/xml");
    url.searchParams.set("user", user);
    url.searchParams.set("key", key);
    url.searchParams.set("query", params.query);
    url.searchParams.set("groupby", String(params.topN));
    if (langMap[params.language]) url.searchParams.set("lr", langMap[params.language]);
    if (countryMap[params.region]) url.searchParams.set("country", countryMap[params.region]);
    if (domainMap[params.region]) url.searchParams.set("domain", domainMap[params.region]);

    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
    const text = await resp.text();

    return this.parseResponse(text);
  }

  private parseResponse(text: string): SerpResult[] {
    // Try JSON first
    try {
      const data = JSON.parse(text);
      if (data.results) {
        return data.results.map((item: any, i: number) => ({
          position: i + 1,
          url: item.url || "",
          title: item.title || "",
          snippet: item.snippet || "",
        }));
      }
    } catch {}

    // Fall back to XML parsing
    const results: SerpResult[] = [];
    const groupRegex = /<group[^>]*>([\s\S]*?)<\/group>/g;
    let match;
    let position = 1;

    while ((match = groupRegex.exec(text)) !== null) {
      const block = match[1];
      const urlMatch = block.match(/<url[^>]*>([\s\S]*?)<\/url>/);
      const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const snippetMatch =
        block.match(/<passage>([\s\S]*?)<\/passage>/) ||
        block.match(/<snippet[^>]*>([\s\S]*?)<\/snippet>/) ||
        block.match(/<passages[^>]*>([\s\S]*?)<\/passages>/);

      if (urlMatch) {
        results.push({
          position: position++,
          url: urlMatch[1].trim(),
          title: titleMatch ? titleMatch[1].trim() : "",
          snippet: snippetMatch ? snippetMatch[1].trim() : "",
        });
      }
    }

    return results;
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { healthy: false, message: "XMLRIVER_USER or XMLRIVER_KEY not set" };
    }
    return { healthy: true, message: "XMLRiver configured" };
  }
}
