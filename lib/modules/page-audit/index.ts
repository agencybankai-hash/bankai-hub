// ═══════════════════════════════════════════════════
// Page Audit Module — Compare page against relevance cloud
// ═══════════════════════════════════════════════════

import { AnalysisModule, ModuleMetadata } from "../types";
import { getLightLLMProvider } from "@/lib/providers/llm";
import { PageContent, RelevanceCloud, Comparison, Entity, PriorityAction } from "@/lib/types";
import { safeParseJSON } from "../relevance-cloud/prompts";

export interface PageAuditInput {
  query: string;
  myPage: PageContent;
  cloud: RelevanceCloud;
}

export interface PageAuditOutput {
  comparison: Comparison;
  meta: {
    llmProvider: string;
    processingTime: number;
  };
}

export const pageAuditMetadata: ModuleMetadata = {
  id: "page-audit",
  name: "Page Audit",
  description: "Compares your page against the relevance cloud to find content gaps",
  version: "2.0.0",
  author: "Bankai Agency",
  category: "analysis",
  icon: "Target",
  requiredEnvVars: ["ANTHROPIC_API_KEY"],
  dependencies: ["relevance-cloud"],
};

export class PageAuditModule implements AnalysisModule<PageAuditInput, PageAuditOutput> {
  metadata = pageAuditMetadata;

  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      const provider = getLightLLMProvider();
      if (!provider.isConfigured()) {
        errors.push("No LLM provider configured");
      }
    } catch (e: any) {
      errors.push(e.message);
    }
    return { valid: errors.length === 0, errors };
  }

  async execute(input: PageAuditInput): Promise<PageAuditOutput> {
    const startTime = Date.now();
    const provider = getLightLLMProvider();

    // Analyze own page with LLM
    const myAnalysis = await this.analyzeOwnPage(input.query, input.myPage, provider);

    // Build comparison
    const comparison = this.buildComparison(input, myAnalysis);

    return {
      comparison,
      meta: {
        llmProvider: provider.id,
        processingTime: Date.now() - startTime,
      },
    };
  }

  private async analyzeOwnPage(
    query: string,
    page: PageContent,
    provider: any
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

    const response = await provider.complete(
      "You are an SEO analyst. Return only valid JSON, no markdown.",
      prompt
    );

    return safeParseJSON(response.text, { entitiesFound: [], topicsCovered: [] });
  }

  private buildComparison(
    input: PageAuditInput,
    myAnalysis: { entitiesFound: string[]; topicsCovered: string[] }
  ): Comparison {
    const { cloud, myPage } = input;

    const cloudEntities = new Map<string, Entity>();
    for (const e of cloud.entities) {
      cloudEntities.set(e.name.toLowerCase(), e);
    }

    const myEntitiesLower = myAnalysis.entitiesFound.map((e) => e.toLowerCase());
    const myTopicsLower = myAnalysis.topicsCovered.map((t) => t.toLowerCase());
    const myText = (myPage.text + " " + myPage.title + " " + myPage.h1).toLowerCase();

    const entitiesPresent: string[] = [];
    const entitiesMissing: Entity[] = [];

    Array.from(cloudEntities.entries()).forEach(([name, entity]) => {
      const found =
        myEntitiesLower.some((e) => e.includes(name) || name.includes(e)) ||
        myText.includes(name);

      if (found) {
        entitiesPresent.push(entity.name);
      } else {
        entitiesMissing.push(entity);
      }
    });

    entitiesMissing.sort((a, b) => {
      const imp = { high: 0, medium: 1, low: 2 };
      const impDiff = (imp[a.importance] || 2) - (imp[b.importance] || 2);
      if (impDiff !== 0) return impDiff;
      return b.frequency - a.frequency;
    });

    const total = cloudEntities.size;
    const covered = entitiesPresent.length;
    const coverage = total > 0 ? covered / total : 0;

    const topicsPresent = cloud.topics.filter(
      (t) =>
        myTopicsLower.some((mt) => mt.includes(t.toLowerCase())) ||
        myText.includes(t.toLowerCase())
    );
    const topicsMissing = cloud.topics.filter((t) => !topicsPresent.includes(t));

    const recommendations = this.generateRecommendations(coverage, entitiesMissing, topicsMissing, myPage, cloud);
    const priorityActions = this.buildPriorityActions(entitiesMissing, topicsMissing);

    return {
      coverageScore: Math.round(coverage * 100) / 100,
      coveragePercent: `${Math.round(coverage * 100)}%`,
      totalEntities: total,
      entitiesPresent,
      entitiesMissing,
      topicsPresent,
      topicsMissing,
      recommendations,
      priorityActions,
      myWordCount: myPage.wordCount,
      recommendedWordCount: cloud.recommendedWordCount,
    };
  }

  private generateRecommendations(
    coverage: number,
    missingEntities: Entity[],
    missingTopics: string[],
    myPage: PageContent,
    cloud: RelevanceCloud
  ): string[] {
    const recs: string[] = [];

    if (coverage < 0.5) {
      recs.push(`⚠️ Критически низкое покрытие (${Math.round(coverage * 100)}%). Страница нуждается в серьёзном дополнении.`);
    } else if (coverage < 0.7) {
      recs.push(`📊 Среднее покрытие (${Math.round(coverage * 100)}%). Есть значительные пробелы.`);
    } else {
      recs.push(`✅ Хорошее покрытие (${Math.round(coverage * 100)}%). Точечная оптимизация.`);
    }

    const high = missingEntities.filter((e) => e.importance === "high");
    if (high.length > 0) {
      recs.push(`🔴 Критически важные отсутствующие: ${high.slice(0, 5).map((e) => e.name).join(", ")}`);
    }

    if (cloud.recommendedWordCount && myPage.wordCount < cloud.recommendedWordCount * 0.7) {
      recs.push(`📝 Текст короткий (${myPage.wordCount} слов). Рекомендуется: ~${cloud.recommendedWordCount}.`);
    }

    if (cloud.questions.length > 0) {
      recs.push(`❓ Добавьте FAQ из ${cloud.questions.length} вопросов ТОП-10`);
    }

    return recs;
  }

  private buildPriorityActions(missingEntities: Entity[], missingTopics: string[]): PriorityAction[] {
    const actions: PriorityAction[] = [];

    for (const e of missingEntities) {
      if (e.importance === "high") {
        actions.push({ priority: "HIGH", action: `Добавить: ${e.name}`, type: e.type, context: e.context });
      }
    }
    for (const e of missingEntities) {
      if (e.importance === "medium") {
        actions.push({ priority: "MEDIUM", action: `Добавить: ${e.name}`, type: e.type, context: e.context });
      }
    }
    for (const topic of missingTopics.slice(0, 5)) {
      actions.push({ priority: "MEDIUM", action: `Раскрыть тему: ${topic}`, type: "topic", context: "" });
    }

    return actions;
  }
}
