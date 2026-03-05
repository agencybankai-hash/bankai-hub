"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getToolBySlug } from "@/lib/tools/registry";
import { Header } from "@/components/layout";
import { Card, CardContent, Button, Input } from "@/components/ui";
import { Play, Loader2, Lock } from "lucide-react";

export default function ToolPage() {
  const params = useParams();
  const projectId = params.id as string;
  const toolSlug = params.toolSlug as string;
  const tool = getToolBySlug(toolSlug);

  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => setProject(data));
  }, [projectId]);

  if (!tool) {
    return (
      <>
        <Header title="Инструмент не найден" />
        <div className="p-6">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-400">
                Инструмент &quot;{toolSlug}&quot; не зарегистрирован.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (tool.status !== "active") {
    return (
      <>
        <Header title={tool.name} subtitle="Скоро будет доступен" />
        <div className="p-6">
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <Lock size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">{tool.description}</p>
                <p className="text-xs text-slate-500 mt-2">Этот инструмент сейчас в разработке</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          projectUrl: project?.url || "",
          language: project?.language || "ru",
          region: project?.region || "ru",
          topN: 10,
          excludeDomains: project?.exclude_domains || [],
          serpProvider: project?.serp_provider || "xmlriver",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка анализа");

      setResult(data);

      // Save result
      await fetch("/api/tool-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          toolSlug,
          query: query.trim(),
          result: data,
        }),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Header title={tool.name} subtitle={project?.name || "Загрузка..."} />

      <div className="p-6 space-y-6">
        <Card>
          <CardContent>
            <form onSubmit={handleRun} className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  id="query"
                  label="Поисковый запрос"
                  placeholder="Введите запрос для анализа..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" loading={running} className="shrink-0">
                {running ? (
                  <><Loader2 size={14} className="animate-spin" /> Анализ...</>
                ) : (
                  <><Play size={14} /> Запустить</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "SERP", value: result.serpCount ?? 0 },
                { label: "Страниц", value: result.pagesParsed ?? 0 },
                { label: "Сущностей", value: result.relevanceCloud?.entities?.length ?? 0 },
                { label: "Покрытие", value: result.comparison?.coveragePercent ?? "—" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent>
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-xl font-bold text-slate-100">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {result.relevanceCloud?.entities && (
              <Card>
                <CardContent>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Облако сущностей</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.relevanceCloud.entities.map((e: any, i: number) => (
                      <span key={i} className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        e.importance === "high" ? "bg-blue-500/20 text-blue-300" :
                        e.importance === "medium" ? "bg-slate-500/20 text-slate-300" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {e.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.comparison?.recommendations && (
              <Card>
                <CardContent>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Рекомендации</h3>
                  <ul className="space-y-2">
                    {result.comparison.recommendations.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-slate-400 flex gap-2">
                        <span className="text-blue-400 shrink-0">→</span>{r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
