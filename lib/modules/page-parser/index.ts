// ═══════════════════════════════════════════════════
// Page Parser Module — Extracts content from web pages
// ═══════════════════════════════════════════════════

import { AnalysisModule, ModuleMetadata } from "../types";
import { PageContent } from "@/lib/types";
import * as cheerio from "cheerio";

const MAX_CONTENT_LENGTH = 50000;
const FETCH_TIMEOUT = 15000;

export interface PageParserInput {
  urls: string[];
}

export interface PageParserOutput {
  pages: PageContent[];
  meta: {
    totalUrls: number;
    successfullyParsed: number;
    failed: number;
    processingTime: number;
  };
}

export const pageParserMetadata: ModuleMetadata = {
  id: "page-parser",
  name: "Page Parser",
  description: "Extracts structured content from web pages using Cheerio",
  version: "2.0.0",
  author: "Bankai Agency",
  category: "data-source",
  icon: "FileText",
};

export class PageParserModule implements AnalysisModule<PageParserInput, PageParserOutput> {
  metadata = pageParserMetadata;

  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async execute(input: PageParserInput): Promise<PageParserOutput> {
    const startTime = Date.now();

    const results = await Promise.allSettled(
      input.urls.map((url) => this.parseSinglePage(url))
    );

    const pages = results
      .filter(
        (r): r is PromiseFulfilledResult<PageContent> =>
          r.status === "fulfilled" && !!r.value.text
      )
      .map((r) => r.value);

    const failed = results.filter((r) => r.status === "rejected").length +
      results.filter(
        (r): r is PromiseFulfilledResult<PageContent> =>
          r.status === "fulfilled" && !r.value.text
      ).length;

    return {
      pages,
      meta: {
        totalUrls: input.urls.length,
        successfullyParsed: pages.length,
        failed,
        processingTime: Date.now() - startTime,
      },
    };
  }

  async parseSinglePage(url: string): Promise<PageContent> {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
        redirect: "follow",
      });

      if (!resp.ok) {
        return this.emptyPage(url, `HTTP ${resp.status}`);
      }

      const html = await resp.text();
      return this.extractContent(url, html);
    } catch (e: any) {
      return this.emptyPage(url, e.message);
    }
  }

  private extractContent(url: string, html: string): PageContent {
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, aside, noscript, iframe, .sidebar, .menu, .navigation, .ad, .advertisement").remove();

    const title = $("title").first().text().trim();
    const h1 = $("h1").first().text().trim();

    const headings: { level: string; text: string }[] = [];
    $("h2, h3, h4").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2) {
        headings.push({ level: el.tagName, text });
      }
    });

    const metaDescription = $('meta[name="description"]').attr("content") || "";

    const mainEl =
      $("article").first().length > 0
        ? $("article").first()
        : $("main").first().length > 0
          ? $("main").first()
          : $('[class*="content"], [class*="article"], [class*="post"], [class*="entry"]').first().length > 0
            ? $('[class*="content"], [class*="article"], [class*="post"], [class*="entry"]').first()
            : $("body");

    let text = mainEl.text() || "";
    text = text
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .split("\n")
      .filter((line) => line.trim().length > 1)
      .join("\n")
      .trim();

    if (text.length > MAX_CONTENT_LENGTH) {
      text = text.slice(0, MAX_CONTENT_LENGTH) + "\n...[truncated]";
    }

    const domain = new URL(url).hostname;
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return { url, domain, title, h1, headings: headings.slice(0, 30), metaDescription, text, wordCount };
  }

  private emptyPage(url: string, error: string): PageContent {
    return { url, domain: "", title: "", h1: "", headings: [], metaDescription: "", text: "", wordCount: 0, error };
  }
}
