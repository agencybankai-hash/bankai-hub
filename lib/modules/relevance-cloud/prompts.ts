// ═══════════════════════════════════════════════════
// Relevance Cloud — Prompts & Parsing
// ═══════════════════════════════════════════════════

import { PageContent, RelevanceCloud } from "@/lib/types";

export function getSystemPrompt(): string {
  return `You are an expert SEO entity analyst specializing in relevance cloud construction.
Your task: analyze TOP search results and extract a comprehensive relevance cloud.

RULES:
1. Extract ALL meaningful entities: materials, processes, brands, locations, concepts, metrics, questions.
2. Rate each entity by frequency (how many of the pages mention it, out of total pages) and importance (high/medium/low).
3. Group entities into semantic clusters.
4. Extract common questions/topics covered across pages.
5. Be thorough — missing entities means missed ranking opportunity.
6. Return ONLY valid JSON, no markdown code blocks, no explanation.`;
}

export function buildExtractionPrompt(query: string, content: string): string {
  return `TARGET QUERY: "${query}"

Below is the combined content from TOP Google results for this query.
Build a comprehensive relevance cloud.

Return this exact JSON structure:
{
  "query": "${query}",
  "entities": [
    {
      "name": "entity name",
      "type": "material|process|brand|location|concept|metric|style|component",
      "frequency": 8,
      "importance": "high",
      "context": "brief description of how this entity is used"
    }
  ],
  "topics": ["topic 1", "topic 2"],
  "questions": ["question 1 found across pages", "question 2"],
  "semanticGroups": [
    { "group": "group name", "entities": ["entity1", "entity2"] }
  ],
  "recommendedWordCount": 1500,
  "contentStructure": ["recommended H2 section 1", "recommended H2 section 2"]
}

===== COMBINED TOP CONTENT =====

${content}`;
}

export function prepareContentForLLM(pages: PageContent[]): string {
  return pages
    .map((page, i) => {
      const text = page.text.slice(0, 5000);
      const headings = page.headings
        .slice(0, 15)
        .map((h) => h.text)
        .join(", ");

      return `--- PAGE ${i + 1}: ${page.domain} ---
Title: ${page.title}
H1: ${page.h1}
Headings: ${headings}
Content:
${text}
`;
    })
    .join("\n");
}

export function parseCloudResponse(query: string, response: string): RelevanceCloud {
  let text = response.trim();
  if (text.startsWith("```")) text = text.split("\n").slice(1).join("\n");
  if (text.endsWith("```")) text = text.slice(0, -3);
  text = text.trim();

  try {
    const data = JSON.parse(text);
    return {
      query: data.query || query,
      entities: (data.entities || []).map((e: any) => ({
        name: e.name || "",
        type: e.type || "concept",
        frequency: e.frequency || 0,
        importance: e.importance || "medium",
        context: e.context || "",
      })),
      topics: data.topics || [],
      questions: data.questions || [],
      semanticGroups: (data.semanticGroups || data.semantic_groups || []).map(
        (g: any) => ({ group: g.group || "", entities: g.entities || [] })
      ),
      recommendedWordCount: data.recommendedWordCount || data.recommended_word_count || 0,
      contentStructure: data.contentStructure || data.content_structure || [],
    };
  } catch {
    return {
      query,
      entities: [],
      topics: [],
      questions: [],
      semanticGroups: [],
      recommendedWordCount: 0,
      contentStructure: [],
    };
  }
}

export function safeParseJSON<T>(text: string, fallback: T): T {
  let clean = text.trim();
  if (clean.startsWith("```")) clean = clean.split("\n").slice(1).join("\n");
  if (clean.endsWith("```")) clean = clean.slice(0, -3);
  try {
    return JSON.parse(clean.trim());
  } catch {
    return fallback;
  }
}
