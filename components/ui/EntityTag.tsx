"use client";

import { useState } from "react";

interface Entity {
  name: string;
  type: string;
  frequency: number;
  importance: "high" | "medium" | "low";
  context: string;
}

interface EntityTagProps {
  entity: Entity;
}

export function EntityTag({ entity }: EntityTagProps) {
  const [showTooltip, setShowTooltip] = useState(false);

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
