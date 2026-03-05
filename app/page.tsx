"use client";

import { useState, useCallback } from "react";
import {
  Cloud, Search, Zap, BarChart3, AlertTriangle,
  Loader2, Globe, Brain, Target, FileText, Box
} from "lucide-react";

// Modular UI Components
import { StatCard } from "@/components/ui/StatCard";
import { TabButton } from "@/components/ui/TabButton";
import { CloudView } from "@/components/views/CloudView";
import { ComparisonView } from "@/components/views/ComparisonView";
import { ExportView } from "@/components/views/ExportView";
import { ModulesView } from "@/components/views/ModulesView";

// ═══════════════════════════════════════════════════
// Types (inline for page state)
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
  _pipeline?: any;
}

// ═══════════════════════════════════════════════════
// Main Page — Modular Platform
// ═══════════════════════════════════════════════════
export default function Home() {
  const [query, setQuery] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [region, setRegion] = useState("us");
  const [serpProvider, setSerpProvider] = useState("xmlriver");
  const [excludeDomainsText, setExcludeDomainsText] = useState(
    "youtube.com\npinterest.com\nreddit.com\namazon.com"
  );
  const [mode, setMode] = useState<"discover" | "audit">("discover");

  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"cloud" | "comparison" | "export" | "modules">("cloud");
  const [selectedResult, setSelectedResult] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);

  const excludeDomains = excludeDomainsText.split("\n").map((d) => d.trim()).filter(Boolean);

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
          language, region, topN: 10, excludeDomains, serpProvider,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) { setError(data.error || "Analysis failed"); return; }

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
              <h1 className="text-lg font-semibold text-white">Bankai Hub</h1>
              <p className="text-xs text-[var(--text-muted)]">Modular SEO Platform v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("modules")}
              className="text-sm text-[var(--text-muted)] hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)]"
            >
              <Box className="w-4 h-4" /> Modules
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-sm text-[var(--text-muted)] hover:text-white transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)]"
            >
              <Zap className="w-4 h-4" /> Settings
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" /> API & Settings
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              API ключи настраиваются через Environment Variables в Vercel Dashboard.
              Необходимые: <code className="text-blue-400">ANTHROPIC_API_KEY</code>,{" "}
              <code className="text-blue-400">XMLRIVER_USER</code>,{" "}
              <code className="text-blue-400">XMLRIVER_KEY</code>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">SERP Provider</label>
                <select value={serpProvider} onChange={(e) => setSerpProvider(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                  <option value="xmlriver">XMLRiver</option>
                  <option value="serpapi">SerpAPI</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Region</label>
                <select value={region} onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
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
              <textarea value={excludeDomainsText} onChange={(e) => setExcludeDomainsText(e.target.value)} rows={3}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none font-mono" />
            </div>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === "modules" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Platform Modules</h2>
              <button onClick={() => setActiveTab("cloud")} className="text-sm text-blue-400 hover:text-blue-300 transition">
                Back to Analysis
              </button>
            </div>
            <ModulesView />
          </div>
        )}

        {/* Main Content */}
        {activeTab !== "modules" && (
          <>
            {/* Input Section */}
            <div className="mb-6 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setMode("discover")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "discover" ? "bg-blue-600 text-white" : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-white"}`}>
                  <Globe className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Discover
                </button>
                <button onClick={() => setMode("audit")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "audit" ? "bg-blue-600 text-white" : "bg-[var(--bg)] text-[var(--text-muted)] hover:text-white"}`}>
                  <Target className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Audit
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !loading && runAnalysis()}
                    placeholder="Введите поисковый запрос..."
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm" />
                </div>
                {mode === "audit" && (
                  <div className="md:w-80">
                    <input type="url" value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)}
                      placeholder="URL вашей страницы для аудита"
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm" />
                  </div>
                )}
                <button onClick={runAnalysis} disabled={loading || !query.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium text-sm transition flex items-center gap-2 whitespace-nowrap">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Анализ...</> : <><Search className="w-4 h-4" /> Анализировать</>}
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                {mode === "discover" ? "Discover — строит облако релевантности из ТОП-10" : "Audit — строит облако + сравнивает с вашей страницей"}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="mb-6 p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] animate-pulse-glow text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">Modular Pipeline Running...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">SERP → Parser → Cloud → Audit</p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && !loading && (
              <>
                {results.length > 1 && (
                  <div className="mb-4 flex gap-2 flex-wrap">
                    {results.map((r, i) => (
                      <button key={i} onClick={() => { setSelectedResult(i); setActiveTab("cloud"); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          selectedResult === i ? "bg-blue-600 text-white" : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-white border border-[var(--border)]"
                        }`}>
                        {r.query}
                      </button>
                    ))}
                  </div>
                )}

                {currentResult && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <StatCard icon={<Globe className="w-4 h-4" />} label="SERP результатов" value={String(currentResult.serpCount)} color="blue" />
                      <StatCard icon={<FileText className="w-4 h-4" />} label="Страниц спарсено" value={String(currentResult.pagesParsed)} color="blue" />
                      <StatCard icon={<Brain className="w-4 h-4" />} label="Сущностей" value={String(currentResult.relevanceCloud?.entities.length || 0)} color="green" />
                      {currentResult.comparison && (
                        <StatCard icon={<Target className="w-4 h-4" />} label="Покрытие" value={currentResult.comparison.coveragePercent}
                          color={currentResult.comparison.coverageScore >= 0.7 ? "green" : currentResult.comparison.coverageScore >= 0.5 ? "yellow" : "red"} />
                      )}
                    </div>

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
                        <FileText className="w-3.5 h-3.5" /> Экспорт
                      </TabButton>
                    </div>

                    {activeTab === "cloud" && currentResult.relevanceCloud && <CloudView cloud={currentResult.relevanceCloud} />}
                    {activeTab === "comparison" && currentResult.comparison && <ComparisonView comparison={currentResult.comparison} />}
                    {activeTab === "export" && <ExportView result={currentResult} />}
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {results.length === 0 && !loading && (
              <div className="text-center py-20">
                <Cloud className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-gray-500 mb-2">Введите запрос для анализа</h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Модульная платформа соберёт ТОП-10 Google, извлечёт сущности и построит облако релевантности
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
