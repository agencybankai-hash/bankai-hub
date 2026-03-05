// ═══════════════════════════════════════════════════
// Analysis API — Modular pipeline execution
// ═══════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { initializeModules, registry } from "@/lib/modules";
import type { SerpCollectorInput, SerpCollectorOutput } from "@/lib/modules/serp-collector";
import type { PageParserInput, PageParserOutput } from "@/lib/modules/page-parser";
import type { RelevanceCloudInput, RelevanceCloudOutput } from "@/lib/modules/relevance-cloud";
import type { PageAuditInput, PageAuditOutput } from "@/lib/modules/page-audit";
import { PageParserModule } from "@/lib/modules/page-parser";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    initializeModules();

    const body = await req.json();
    const {
      query,
      projectUrl,
      language = "en",
      region = "us",
      topN = 10,
      excludeDomains = [],
      serpProvider = "xmlriver",
    } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // ─── Step 1: SERP Collection (via module) ───
    const serpOutput = await registry.execute<SerpCollectorInput, SerpCollectorOutput>(
      "serp-collector",
      { query, provider: serpProvider, topN, language, region, excludeDomains }
    );

    if (serpOutput.results.length === 0) {
      return NextResponse.json({
        error: "No SERP results found. Check your API keys and query.",
      }, { status: 400 });
    }

    // ─── Step 2: Page Parsing (via module) ───
    const urls = serpOutput.results.map((r) => r.url);
    const parserOutput = await registry.execute<PageParserInput, PageParserOutput>(
      "page-parser",
      { urls }
    );

    if (parserOutput.pages.length === 0) {
      return NextResponse.json({
        error: "Could not parse any pages from SERP results.",
      }, { status: 400 });
    }

    // ─── Step 3: Relevance Cloud (via module) ───
    const cloudOutput = await registry.execute<RelevanceCloudInput, RelevanceCloudOutput>(
      "relevance-cloud",
      { query, pages: parserOutput.pages }
    );

    // ─── Step 4: Page Audit (via module, if URL provided) ───
    let comparison = null;
    let auditMeta = null;

    if (projectUrl) {
      const parserModule = registry.getImplementation("page-parser") as PageParserModule;
      const myPage = await parserModule.parseSinglePage(projectUrl);

      if (myPage.text) {
        const auditOutput = await registry.execute<PageAuditInput, PageAuditOutput>(
          "page-audit",
          { query, myPage, cloud: cloudOutput.cloud }
        );
        comparison = auditOutput.comparison;
        auditMeta = auditOutput.meta;
      }
    }

    return NextResponse.json({
      query,
      serpCount: serpOutput.results.length,
      serpResults: serpOutput.results,
      pagesParsed: parserOutput.pages.length,
      relevanceCloud: cloudOutput.cloud,
      comparison,
      timestamp: new Date().toISOString(),
      status: "done",
      // Module pipeline metadata
      _pipeline: {
        serp: serpOutput.meta,
        parser: parserOutput.meta,
        cloud: cloudOutput.meta,
        ...(auditMeta ? { audit: auditMeta } : {}),
      },
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
