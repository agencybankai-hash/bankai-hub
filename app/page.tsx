"use client";

import { useState, useCallback } from "react";
import {
  Cloud, Search, Zap, BarChart3, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, Download, Loader2, Plus, X,
  Globe, Brain, Target, FileText, ArrowRight, Copy, Check
} from "lucide-react";

// ═══════════════════════════════════════════════════
// Types (inline to keep page self-contained)
// ═══════════════════════════════════════════════════
interface Entity {
  name: string;
  type: string;
  frequency: number;
  importance: "high" | "medium" | "low";
  context: string;
}

interface AnalysisResult {
  query: string;
  serpCount: number;
  pagesParsed: number;
  relevanceCloud: {
    query: string;
    entities: Entity[];
    topics: string[];
    questions: string[];
    semanticGroups: { group: string; entities: string[] }[];
    recommendedWordCount: number;
    contentStructure: string[];
  } | null;
  comparison: {
    coverageScore: number;
    coveragePercent: string;
    totalEntities: number;
    entitiesPresent: string[];
    entitiesMissing: Entity[];
    topicsPresent: string[];
    topicsMissing: string[];
    recommendations: string[];
    priorityActions: {
      priority: string;
      action: string;
      type: string;
      context: string;
    }[];
    myWordCount: number;
    recommendedWordCount: number;
  } | null;
  timestamp: string;
  status: string;
  error?: string;
}

// ═══════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════
export default function Home() {
  // Config state
  const [query, setQuery] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("us");
  const [serpProvider, setSerpProvider] = useState("xmlriver");
  const [excludeDomainsText, setExcludeDomainsText] = useState(
    "youtube.com\npinterest.com\nreddit.com\namazon.com"
  );
  const [mode, setMode] = useState<"discover" | "audit">("discover");

  // Results state
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"cloud" | "comparison" | "export">("cloud");
  const [selectedResult, setSelectedResult] = useState<number>(0);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);

  const excludeDomains = excludeDomainsText
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean);

  // ─── Run Analysis ───
  const runAnalysis = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          projectUrl: mode === "audit" ? projectUrl.trim() : undefined,
          language,
          region,
          topN: 10,
          excludeDomains,
          serpProvider,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Analysis failed");
        return;
      }

      setResults((prev) => [data, ...prev]);
      setSelectedResult(0);
      setActiveTab("cloud");
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [query, projectUrl, language, region, excludeDomains, serpProvider, mode]);

  const currentResult = results[selectedResult] || null;

  return (
    <div className="min-h-screen">
      {/* ═══ Header ═══ */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Relevance Cloud Engine</h1>
              <p className="text-xs text-[var(--text-muted)]">SEO Entity & Relevance Analysis</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-[var(--text-muted)] hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)]"
          >
            <Zap className="w-4 h-4" />
            API Settings
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ═══ Settings Panel ═══ */}
        {showSettings && (
          <div className="mb-6 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" /> API & Настройки
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              API ключи настраиваются через Environment Variables в Vercel Dashboard → Settings → Environment Variables.
              Необходимые ключи: <code className="text-blue-400">ANTHROPIC_API_KEY</code>,{" "}
              <code className="text-blue-400">XMLRIVER_USER</code>,{" "}
              <code className="text-blue-400">XMLRIVER_KEY</code>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">SERP Provider</label>
                <select
                  value={serpProvider}
                  onChange={(e) => setSerpProvider(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="xmlriver">xmlriver</option>
                  <option value="serpapi">SerpAPI</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="us">US</option>
                  <option value="uk">UK</option>
                  <option value="de">DE</option>
                  <option value="ru">RU</option>
                  <option value="kz">KZ</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs text-[var(--text-muted)] mb-1 block">Exclude Domains (one per line)</label>
              <textarea
                value={excludeDomainsText}
                onChange={(e) => setExcludeDomainsText(e.target.value)}
                rows={3}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        )}

        {/* ═══ Input Section ═══ */}
        <div className="mb-6 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("discover")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === "discover"
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-white"
              }`}
            >
              <Globe className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Discover
            </button>
            <button
              onClick={() => setMode("audit")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                mode === "audit"
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-white"
              }`}
            >
              <Target className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Audit
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && runAnalysis()}
                placeholder="Введите поисковый запрос... (например: kitchen cabinet refacing)"
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            {mode === "audit" && (
              <div className="md:w-80">
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="URL вашей страницы для аудита"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
            )}
            <button
              onClick={runAnalysis}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium text-sm transition flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Анализ...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Анализировать
                </>
              )}
            </button>
          </div>

          {mode === "discover" && (
            <p className="text-xs text-[var(--text-muted)] mt-2">
              🔍 Discover — строит облако релевантности из ТОП-10 без сравнения
            </p>
          )}
          {mode === "audit" && (
            <p className="text-xs text-[var(--text-muted)] mt-2">
              🎯 Audit — строит облако + сравнивает с вашей страницей, находит пробелы
            </p>
          )}
        </div>

        {/* ═══ Error ═══ */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ═══ Loading ═══ */}
        {loading && (
          <div className="mb-6 p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse-glow text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Анализ ТОП-10 Google...</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              SERP → Парсинг контента → LLM анализ → Построение облака
            </p>
          </div>
        )}

        {/* ═══ Results ═══ */}
        {results.length > 0 && !loading && (
          <>
            {/* Result selector */}
            {results.length > 1 && (
              <div className="mb-4 flex gap-2 flex-wrap">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedResult(i); setActiveTab("cloud"); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      selectedResult === i
                        ? "bg-blue-600 text-white"
                        : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
                    }`}
                  >
                    {r.query}
                  </button>
                ))}
              </div>
            )}

            {currentResult && (
              <div>
                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <StatCard
                    icon={<Globe className="w-4 h-4" />}
                    label="SERP результатов"
                    value={String(currentResult.serpCount)}
                    color="blue"
                  />
                  <StatCard
                    icon={<FileText className="w-4 h-4" />}
                    label="Страниц спарсено"
                    value={String(currentResult.pagesParsed)}
                    color="blue"
                  />
                  <StatCard
                    icon={<Brain className="w-4 h-4" />}
                    label="Сущностей"
                    value={String(currentResult.relevanceCloud?.entities.length || 0)}
                    color="green"
                  />
                  {currentResult.comparison && (
                    <StatCard
                      icon={<Target className="w-4 h-4" />}
                      label="Покрытие"
                      value={currentResult.comparison.coveragePercent}
                      color={
                        currentResult.comparison.coverageScore >= 0.7
                          ? "green"
                          : currentResult.comparison.coverageScore >= 0.5
                            ? "yellow"
                            : "red"
                      }
                    />
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-[var(--border)] pb-px">
                  <TabButton active={activeTab === "cloud"} onClick={() => setActiveTab("cloud")}>
                    <Cloud className="w-3.5 h-3.5" /> Облако
                  </TabButton>
                  {currentResult.comparison && (
                    <TabButton active={activeTab === "comparison"} onClick={() => setActiveTab("comparison")}>
                      <BarChart3 className="w-3.5 h-3.5" /> Аудит
                    </TabButton>
                  )}
                  <TabButton active={activeTab === "export"} onClick={() => setActiveTab("export")}>
                    <Download className="w-3.5 h-3.5" /> Экспорт
                  </TabButton>
                </div>

                {/* Tab Content */}
                {activeTab === "cloud" && currentResult.relevanceCloud && (
                  <CloudView cloud={currentResult.relevanceCloud} />
                )}
                {activeTab === "comparison" && currentResult.comparison && (
                  <ComparisonView comparison={currentResult.comparison} />
                )}
                {activeTab === "export" && (
                  <ExportView result={currentResult} />
                )}
              </div>
            )}
          </>
        )}

        {/* ═══ Empty State ═══ */}
        {results.length === 0 && !loading && (
          <div className="text-center py-20">
            <Cloud className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-500 mb-2">
              Введите запрос для анализа
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Модуль соберёт ТОП-10 Google, извлечёт сущности через Claude API
              и построит облако релевантности
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
  };
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
      <div className={`flex items-center gap-1.5 text-xs ${colorMap[color] || "text-blue-400"} mb-1`}>
        {icon} {label}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition rounded-t-lg ${
        active
          ? "text-blue-400 border-b-2 border-blue-400 -mb-px"
          : "text-[var(--text-muted)] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Cloud View ───
function CloudView({ cloud }: { cloud: AnalysisResult["relevanceCloud"] }) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  if (!cloud) return null;

  const highEntities = cloud.entities.filter((e) => e.importance === "high");
  const medEntities = cloud.entities.filter((e) => e.importance === "medium");
  const lowEntities = cloud.entities.filter((e) => e.importance === "low");

  return (
    <div className="space-y-4">
      {/* Entity Cloud Visual */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" /> Сущности ({cloud.entities.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {cloud.entities
            .sort((a, b) => b.frequency - a.frequency)
            .map((entity, i) => (
              <EntityTag key={i} entity={entity} />
            ))}
        </div>
      </div>

      {/* Semantic Groups */}
      {cloud.semanticGroups.length > 0 && (
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-sm font-medium text-white mb-3">
            Семантические группы
          </h3>
          <div className="space-y-2">
            {cloud.semanticGroups.map((group, i) => (
              <div key={i} className="border border-[var(--border)] rounded-lg">
                <button
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === group.group ? null : group.group
                    )
                  }
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-[var(--bg-card-hover)] rounded-lg transition"
                >
                  <span className="font-medium">{group.group}</span>
                  <span className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span className="text-xs">{group.entities.length}</span>
                    {expandedGroup === group.group ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                </button>
                {expandedGroup === group.group && (
                  <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                    {group.entities.map((e, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs border border-blue-500/20"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns: Topics + Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cloud.topics.length > 0 && (
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <h3 className="text-sm font-medium text-white mb-3">
              📋 Темы в ТОП-10
            </h3>
            <ul className="space-y-1.5">
              {cloud.topics.map((t, i) => (
                <li key={i} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0 text-blue-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {cloud.questions.length > 0 && (
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <h3 className="text-sm font-medium text-white mb-3">
              ❓ Вопросы (для FAQ)
            </h3>
            <ul className="space-y-1.5">
              {cloud.questions.map((q, i) => (
                <li key={i} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
                  <span className="text-yellow-400 flex-shrink-0">Q:</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Content Structure */}
      {cloud.contentStructure.length > 0 && (
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-sm font-medium text-white mb-3">
            📐 Рекомендуемая структура
          </h3>
          <div className="space-y-1.5">
            {cloud.contentStructure.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-[var(--text-muted)] w-6">H2</span>
                <span className="text-white">{s}</span>
              </div>
            ))}
          </div>
          {cloud.recommendedWordCount > 0 && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Рекомендуемый объём: ~{cloud.recommendedWordCount} слов
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EntityTag({ entity }: { entity: Entity }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Size based on frequency
  const sizeClass =
    entity.frequency >= 7 ? "text-sm px-3 py-1.5" :
    entity.frequency >= 4 ? "text-xs px-2.5 py-1" :
    "text-xs px-2 py-0.5";

  const impClass = `tag-${entity.importance}`;

  return (
    <span
      className={`${impClass} ${sizeClass} rounded-full font-medium cursor-default relative inline-block`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {entity.name}
      {showTooltip && entity.context && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-[var(--border)] rounded-lg text-xs text-gray-300 whitespace-nowrap z-50 shadow-xl max-w-xs">
          <span className="text-[var(--text-muted)]">{entity.type}</span> · freq: {entity.frequency}
          <br />
          {entity.context}
        </span>
      )}
    </span>
  );
}

// ─── Comparison View ───
function ComparisonView({ comparison }: { comparison: NonNullable<AnalysisResult["comparison"]> }) {
  return (
    <div className="space-y-4">
      {/* Coverage gauge */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-white mb-4">Покрытие облака</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1e2a3a" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={
                  comparison.coverageScore >= 0.7 ? "#22c55e" :
                  comparison.coverageScore >= 0.5 ? "#eab308" : "#ef4444"
                }
                strokeWidth="8"
                strokeDasharray={`${comparison.coverageScore * 264} 264`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
              {comparison.coveragePercent}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-[var(--text-muted)]">Найдено:</span>
              <span className="text-white font-medium">{comparison.entitiesPresent.length} сущностей</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" />
              <span className="text-[var(--text-muted)]">Отсутствует:</span>
              <span className="text-white font-medium">{comparison.entitiesMissing.length} сущностей</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-[var(--text-muted)]">Объём:</span>
              <span className="text-white font-medium">
                {comparison.myWordCount} / {comparison.recommendedWordCount} слов
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {comparison.recommendations.length > 0 && (
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-sm font-medium text-white mb-3">Рекомендации</h3>
          <div className="space-y-2">
            {comparison.recommendations.map((r, i) => (
              <p key={i} className="text-sm text-[var(--text-muted)]">{r}</p>
            ))}
          </div>
        </div>
      )}

      {/* Priority Actions */}
      {comparison.priorityActions.length > 0 && (
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-sm font-medium text-white mb-3">Приоритетные действия</h3>
          <div className="space-y-1.5">
            {comparison.priorityActions.slice(0, 20).map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-3 py-2 rounded-lg bg-[var(--bg)] text-sm"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                    a.priority === "HIGH" ? "tag-high" : "tag-medium"
                  }`}
                >
                  {a.priority}
                </span>
                <div>
                  <span className="text-white">{a.action}</span>
                  {a.context && (
                    <span className="text-[var(--text-muted)] ml-1">— {a.context}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Entities */}
      {comparison.entitiesMissing.length > 0 && (
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-sm font-medium text-white mb-3">
            Отсутствующие сущности ({comparison.entitiesMissing.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {comparison.entitiesMissing.map((e, i) => (
              <EntityTag key={i} entity={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export View ───
function ExportView({ result }: { result: AnalysisResult }) {
  const [copied, setCopied] = useState(false);

  const jsonStr = JSON.stringify(result, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relevance_${result.query.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={downloadJSON}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Скачать JSON
        </button>
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-white rounded-lg text-sm font-medium transition flex items-center gap-2 border border-[var(--border)]"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Скопировано!" : "Копировать JSON"}
        </button>
      </div>
      <pre className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-muted)] overflow-auto max-h-96 font-mono">
        {jsonStr}
      </pre>
    </div>
  );
}
