import { NextRequest, NextResponse } from "next/server";
import { collectSerp } from "@/lib/serp";
import { parsePages, parseSinglePage } from "@/lib/parser";
import { buildRelevanceCloud } from "@/lib/analyzer";
import { compareWithCloud } from "@/lib/comparator";

export const maxDuration = 120; // Vercel Pro: up to 300s

export async function POST(req: NextRequest) {
  try {
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

    // Step 1: Collect SERP
    const serpResults = await collectSerp(
      query, serpProvider, topN, language, region, excludeDomains
    );

    if (serpResults.length === 0) {
      return NextResponse.json({
        error: "No SERP results found. Check your API keys and query.",
      }, { status: 400 });
    }

    // Step 2: Parse pages
    const urls = serpResults.map((r) => r.url);
    const pagesContent = await parsePages(urls);

    if (pagesContent.length === 0) {
      return NextResponse.json({
        error: "Could not parse any pages from SERP results.",
      }, { status: 400 });
    }

    // Step 3: Build relevance cloud via LLM
    const relevanceCloud = await buildRelevanceCloud(query, pagesContent);

    // Step 4: Compare with own page (if URL provided)
    let comparison = null;
    if (projectUrl) {
      const myPage = await parseSinglePage(projectUrl);
      if (myPage.text) {
        comparison = await compareWithCloud(query, myPage, relevanceCloud);
      }
    }

    return NextResponse.json({
      query,
      serpCount: serpResults.length,
      serpResults,
      pagesParsed: pagesContent.length,
      relevanceCloud,
      comparison,
      timestamp: new Date().toISOString(),
      status: "done",
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
