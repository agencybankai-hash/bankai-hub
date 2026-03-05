"use client";

import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "yellow" | "red";
}

const colorMap: Record<string, string> = {
  blue: "text-blue-400",
  green: "text-green-400",
  yellow: "text-yellow-400",
  red: "text-red-400",
};

export function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
      <div className={`flex items-center gap-1.5 text-xs ${colorMap[color] || "text-blue-400"} mb-1`}>
        {icon} {label}
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}
