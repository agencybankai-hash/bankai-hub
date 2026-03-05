import { NextRequest, NextResponse } from "next/server";
import { collectSerp } from "@/lib/serp";
import { parsePages, parseSinglePage } from "@/lib/parser";
import { buildRelevanceCloud } from "@/lib/analyzer";
import { compareWithCloud } from "@/lib/comparator";
import type { AnalysisRequest, AnalysisResult } from "@/lib/types";

export const maxDuration = 120; // Vercel Pro

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();

    if (!body.query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const {
      query,
      projectUrl,
      language = "ru",
      region = "ru",
      topN = 10,
      excludeDomains = [],
      serpProvider = "xmlriver",
    } = body;

    // 1. Collect SERP
    const serpResults = await collectSerp(
      query,
      serpProvider,
      topN,
      language,
      region,
      excludeDomains
    );

    if (serpResults.length === 0) {
      return NextResponse.json(
        { error: "No SERP results found" },
        { status: 404 }
      );
    }

    // 2. Parse pages
    const urls = serpResults.map((r) => r.url);
    const pages = await parsePages(urls);

    if (pages.length === 0) {
      return NextResponse.json(
        { error: "Could not parse any pages" },
        { status: 500 }
      );
    }

    // 3. Build relevance cloud
    const relevanceCloud = await buildRelevanceCloud(query, pages);

    // 4. Compare with own page (if URL provided)
    let comparison = null;
    if (projectUrl) {
      try {
        const myPage = await parseSinglePage(projectUrl);
        comparison = await compareWithCloud(query, myPage, relevanceCloud);
      } catch (err) {
        console.warn("Could not parse project URL for comparison:", err);
      }
    }

    const result: AnalysisResult = {
      query,
      serpCount: serpResults.length,
      pagesParsed: pages.length,
      relevanceCloud,
      comparison,
      timestamp: new Date().toISOString(),
      status: "done",
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
