"use client";

import { useState } from "react";
import { Download, Copy, Check } from "lucide-react";

interface ExportViewProps {
  result: any;
}

export function ExportView({ result }: ExportViewProps) {
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
          <Download className="w-4 h-4" /> Скачать JSON
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
