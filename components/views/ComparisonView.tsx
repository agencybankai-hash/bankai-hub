"use client";

import { CheckCircle2, X, FileText } from "lucide-react";
import { EntityTag } from "@/components/ui/EntityTag";

interface Entity {
  name: string;
  type: string;
  frequency: number;
  importance: "high" | "medium" | "low";
  context: string;
}

interface ComparisonData {
  coverageScore: number;
  coveragePercent: string;
  totalEntities: number;
  entitiesPresent: string[];
  entitiesMissing: Entity[];
  topicsPresent: string[];
  topicsMissing: string[];
  recommendations: string[];
  priorityActions: { priority: string; action: string; type: string; context: string }[];
  myWordCount: number;
  recommendedWordCount: number;
}

interface ComparisonViewProps {
  comparison: ComparisonData;
}

export function ComparisonView({ comparison }: ComparisonViewProps) {
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
              <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-[var(--bg)] text-sm">
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                  a.priority === "HIGH" ? "tag-high" : "tag-medium"
                }`}>
                  {a.priority}
                </span>
                <div>
                  <span className="text-white">{a.action}</span>
                  {a.context && <span className="text-[var(--text-muted)] ml-1">— {a.context}</span>}
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
