"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { EntityTag } from "@/components/ui/EntityTag";

interface Entity {
  name: string;
  type: string;
  frequency: number;
  importance: "high" | "medium" | "low";
  context: string;
}

interface RelevanceCloudData {
  query: string;
  entities: Entity[];
  topics: string[];
  questions: string[];
  semanticGroups: { group: string; entities: string[] }[];
  recommendedWordCount: number;
  contentStructure: string[];
}

interface CloudViewProps {
  cloud: RelevanceCloudData;
}

export function CloudView({ cloud }: CloudViewProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Entity Cloud */}
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
          <h3 className="text-sm font-medium text-white mb-3">Семантические группы</h3>
          <div className="space-y-2">
            {cloud.semanticGroups.map((group, i) => (
              <div key={i} className="border border-[var(--border)] rounded-lg">
                <button
                  onClick={() => setExpandedGroup(expandedGroup === group.group ? null : group.group)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-white hover:bg-[var(--bg-card-hover)] rounded-lg transition"
                >
                  <span className="font-medium">{group.group}</span>
                  <span className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span className="text-xs">{group.entities.length}</span>
                    {expandedGroup === group.group ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </button>
                {expandedGroup === group.group && (
                  <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                    {group.entities.map((e, j) => (
                      <span key={j} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded text-xs border border-blue-500/20">
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

      {/* Topics + Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cloud.topics.length > 0 && (
          <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <h3 className="text-sm font-medium text-white mb-3">Темы в ТОП-10</h3>
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
            <h3 className="text-sm font-medium text-white mb-3">Вопросы (для FAQ)</h3>
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
          <h3 className="text-sm font-medium text-white mb-3">Рекомендуемая структура</h3>
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
