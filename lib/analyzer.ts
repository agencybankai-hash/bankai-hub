import { PageContent, RelevanceCloud, Entity } from "./types";

const MAX_TOKENS = 4096;

export async function buildRelevanceCloud(
  query: string,
  pages: PageContent[]
): Promise<RelevanceCloud> {
  const combinedContent = prepareContentForLLM(pages);
  const prompt = buildExtractionPrompt(query, combinedContent);
  const systemPrompt = getSystemPrompt();

  const response = await callClaude(systemPrompt, prompt);
  return parseCloudResponse(query, response);
}

export async function analyzeOwnPage(
  query: string,
  page: PageContent
): Promise<{ entitiesFound: string[]; topicsCovered: string[] }> {
  const prompt = `Analyze this page content for the query "${query}".

Extract all entities, terms, topics mentioned on the page.
Return JSON only:
{
  "entitiesFound": ["entity1", "entity2"],
  "topicsCovered": ["topic1", "topic2"]
}

PAGE:
Title: ${page.title}
H1: ${page.h1}
Headings: ${page.headings.map((h) => h.text).join(", ")}

Text (first 8000 chars):
${page.text.slice(0, 8000)}`;

  // Use DeepSeek for simple tasks if available, otherwise Claude
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  let response: string;

  if (deepseekKey) {
    response = await callDeepSeek(
      "You are an SEO analyst. Return only valid JSON, no markdown.",
      prompt
    );
  } else {
    response = await callClaude(
      "You are an SEO analyst. Return only valid JSON, no markdown.",
      prompt
    );
  }

  return safeParseJSON(response, { entitiesFound: [], topicsCovered: [] });
}

// ═══════════════════════════════════════
// Prompts
// ═══════════════════════════════════════
function getSystemPrompt(): string {
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

function buildExtractionPrompt(query: string, content: string): string {
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

function prepareContentForLLM(pages: PageContent[]): string {
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

// ═══════════════════════════════════════
// LLM Calls
// ═══════════════════════════════════════
async function callClaude(system: string, prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data = await resp.json();

  if (data.content?.[0]?.text) {
    return data.content[0].text;
  }
  if (data.error) {
    throw new Error(`Claude API: ${JSON.stringify(data.error)}`);
  }
  return "";
}

async function callDeepSeek(system: string, prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is required");

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(120000),
  });

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

// ═══════════════════════════════════════
// Parsing
// ═══════════════════════════════════════
function parseCloudResponse(query: string, response: string): RelevanceCloud {
  let text = response.trim();
  // Strip markdown code blocks
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
        (g: any) => ({
          group: g.group || "",
          entities: g.entities || [],
        })
      ),
      recommendedWordCount:
        data.recommendedWordCount || data.recommended_word_count || 0,
      contentStructure:
        data.contentStructure || data.content_structure || [],
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

function safeParseJSON<T>(text: string, fallback: T): T {
  let clean = text.trim();
  if (clean.startsWith("```")) clean = clean.split("\n").slice(1).join("\n");
  if (clean.endsWith("```")) clean = clean.slice(0, -3);
  try {
    return JSON.parse(clean.trim());
  } catch {
    return fallback;
  }
}
