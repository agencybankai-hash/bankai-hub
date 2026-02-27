import { PageContent, RelevanceCloud, Comparison, Entity, PriorityAction } from "./types";
import { analyzeOwnPage } from "./analyzer";

export async function compareWithCloud(
  query: string,
  myPage: PageContent,
  cloud: RelevanceCloud
): Promise<Comparison> {
  // Analyze own page with LLM
  const myAnalysis = await analyzeOwnPage(query, myPage);

  const cloudEntities = new Map<string, Entity>();
  for (const e of cloud.entities) {
    cloudEntities.set(e.name.toLowerCase(), e);
  }

  const myEntitiesLower = myAnalysis.entitiesFound.map((e) => e.toLowerCase());
  const myTopicsLower = myAnalysis.topicsCovered.map((t) => t.toLowerCase());
  const myText = (
    myPage.text + " " + myPage.title + " " + myPage.h1
  ).toLowerCase();

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

  // Sort missing by importance then frequency
  entitiesMissing.sort((a, b) => {
    const imp = { high: 0, medium: 1, low: 2 };
    const impDiff = (imp[a.importance] || 2) - (imp[b.importance] || 2);
    if (impDiff !== 0) return impDiff;
    return b.frequency - a.frequency;
  });

  const total = cloudEntities.size;
  const covered = entitiesPresent.length;
  const coverage = total > 0 ? covered / total : 0;

  // Topics
  const topicsPresent = cloud.topics.filter(
    (t) =>
      myTopicsLower.some((mt) => mt.includes(t.toLowerCase())) ||
      myText.includes(t.toLowerCase())
  );
  const topicsMissing = cloud.topics.filter(
    (t) => !topicsPresent.includes(t)
  );

  // Recommendations
  const recommendations = generateRecommendations(
    coverage, entitiesMissing, topicsMissing, myPage, cloud
  );

  const priorityActions = buildPriorityActions(entitiesMissing, topicsMissing);

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

function generateRecommendations(
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

function buildPriorityActions(
  missingEntities: Entity[],
  missingTopics: string[]
): PriorityAction[] {
  const actions: PriorityAction[] = [];

  for (const e of missingEntities) {
    if (e.importance === "high") {
      actions.push({
        priority: "HIGH",
        action: `Добавить: ${e.name}`,
        type: e.type,
        context: e.context,
      });
    }
  }

  for (const e of missingEntities) {
    if (e.importance === "medium") {
      actions.push({
        priority: "MEDIUM",
        action: `Добавить: ${e.name}`,
        type: e.type,
        context: e.context,
      });
    }
  }

  for (const topic of missingTopics.slice(0, 5)) {
    actions.push({
      priority: "MEDIUM",
      action: `Раскрыть тему: ${topic}`,
      type: "topic",
      context: "",
    });
  }

  return actions;
}
