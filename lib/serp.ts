import { SerpResult } from "./types";

export async function collectSerp(
  query: string,
  provider: string,
  topN: number,
  language: string,
  region: string,
  excludeDomains: string[]
): Promise<SerpResult[]> {
  let results: SerpResult[] = [];

  if (provider === "xmlriver") {
    results = await collectXmlriver(query, topN, language, region);
  } else if (provider === "serpapi") {
    results = await collectSerpApi(query, topN, language, region);
  } else {
    throw new Error(`Unknown SERP provider: ${provider}`);
  }

  // Filter excluded domains
  if (excludeDomains.length > 0) {
    results = results.filter(
      (r) => !excludeDomains.some((d) => r.url.includes(d))
    );
  }

  return results.slice(0, topN);
}

async function collectXmlriver(
  query: string,
  topN: number,
  language: string,
  region: string
): Promise<SerpResult[]> {
  const user = process.env.XMLRIVER_USER;
  const key = process.env.XMLRIVER_KEY;

  if (!user || !key) throw new Error("XMLRIVER_USER and XMLRIVER_KEY required");

  const url = new URL("https://xmlriver.com/search_serp/xml/");
  url.searchParams.set("user", user);
  url.searchParams.set("key", key);
  url.searchParams.set("query", query);
  url.searchParams.set("groupby", String(topN));
  url.searchParams.set("domain", "google.com");
  url.searchParams.set("lang", language);
  url.searchParams.set("country", region);

  const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
  const text = await resp.text();

  return parseXmlriverResponse(text);
}

function parseXmlriverResponse(text: string): SerpResult[] {
  const results: SerpResult[] = [];

  // Try JSON first (some xmlriver endpoints return JSON)
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

  // Parse XML response
  // Simple XML parsing for <group><doc> structure
  const groupRegex = /<group[^>]*>([\s\S]*?)<\/group>/g;
  let match;
  let position = 1;

  while ((match = groupRegex.exec(text)) !== null) {
    const block = match[1];
    const urlMatch = block.match(/<url[^>]*>([\s\S]*?)<\/url>/);
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const snippetMatch =
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

async function collectSerpApi(
  query: string,
  topN: number,
  language: string,
  region: string
): Promise<SerpResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY required");

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", String(topN));
  url.searchParams.set("hl", language);
  url.searchParams.set("gl", region);

  const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(30000) });
  const data = await resp.json();

  return (data.organic_results || []).map((item: any, i: number) => ({
    position: i + 1,
    url: item.link || "",
    title: item.title || "",
    snippet: item.snippet || "",
  }));
}
