export interface ProjectConfig {
  name: string;
  url?: string;
  language: string;
  region: string;
  queries: string[];
  serpProvider: "xmlriver" | "serpapi";
  excludeDomains: string[];
  topN: number;
}

export interface SerpResult {
  position: number;
  url: string;
  title: string;
  snippet: string;
}

export interface PageContent {
  url: string;
  domain: string;
  title: string;
  h1: string;
  headings: { level: string; text: string }[];
  metaDescription: string;
  text: string;
  wordCount: number;
  error?: string;
}

export interface Entity {
  name: string;
  type: string;
  frequency: number;
  importance: "high" | "medium" | "low";
  context: string;
}

export interface SemanticGroup {
  group: string;
  entities: string[];
}

export interface RelevanceCloud {
  query: string;
  entities: Entity[];
  topics: string[];
  questions: string[];
  semanticGroups: SemanticGroup[];
  recommendedWordCount: number;
  contentStructure: string[];
}

export interface Comparison {
  coverageScore: number;
  coveragePercent: string;
  totalEntities: number;
  entitiesPresent: string[];
  entitiesMissing: Entity[];
  topicsPresent: string[];
  topicsMissing: string[];
  recommendations: string[];
  priorityActions: PriorityAction[];
  myWordCount: number;
  recommendedWordCount: number;
}

export interface PriorityAction {
  priority: "HIGH" | "MEDIUM" | "LOW";
  action: string;
  type: string;
  context: string;
}

export interface AnalysisResult {
  query: string;
  serpCount: number;
  pagesParsed: number;
  relevanceCloud: RelevanceCloud | null;
  comparison: Comparison | null;
  timestamp: string;
  status: "pending" | "running" | "done" | "error";
  error?: string;
}

export interface AnalysisRequest {
  query: string;
  projectUrl?: string;
  language: string;
  region: string;
  topN: number;
  excludeDomains: string[];
  serpProvider: string;
}
