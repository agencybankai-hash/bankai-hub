"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Box } from "lucide-react";

interface ModuleInfo {
  metadata: {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    icon: string;
  };
  status: string;
  error?: string;
  lastRun?: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  configured: boolean;
}

interface PlatformStatus {
  platform: { name: string; version: string; architecture: string };
  modules: {
    total: number;
    active: number;
    inactive: number;
    error: number;
    modules: ModuleInfo[];
  };
  providers: {
    llm: ProviderInfo[];
    serp: ProviderInfo[];
  };
}

export function ModulesView() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/modules")
      .then((r) => r.json())
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!status) return null;

  const statusIcon = (s: string) => {
    switch (s) {
      case "active": return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "error": return <XCircle className="w-4 h-4 text-red-400" />;
      case "loading": return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Platform Info */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Box className="w-4 h-4 text-blue-400" />
          {status.platform.name} v{status.platform.version}
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Architecture: {status.platform.architecture} · {status.modules.total} modules registered
        </p>
      </div>

      {/* Modules */}
      <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
        <h3 className="text-sm font-medium text-white mb-3">Модули</h3>
        <div className="space-y-2">
          {status.modules.modules.map((mod) => (
            <div key={mod.metadata.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
              <div className="flex items-center gap-3">
                {statusIcon(mod.status)}
                <div>
                  <span className="text-sm text-white font-medium">{mod.metadata.name}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">v{mod.metadata.version}</span>
                  <p className="text-xs text-[var(--text-muted)]">{mod.metadata.description}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${
                mod.metadata.category === "analysis" ? "bg-blue-500/10 text-blue-300" :
                mod.metadata.category === "data-source" ? "bg-green-500/10 text-green-300" :
                "bg-gray-500/10 text-gray-300"
              }`}>
                {mod.metadata.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-sm font-medium text-white mb-3">LLM Providers</h3>
          <div className="space-y-2">
            {status.providers.llm.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                {p.configured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-white">{p.name}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {p.configured ? "configured" : "not configured"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
          <h3 className="text-sm font-medium text-white mb-3">SERP Providers</h3>
          <div className="space-y-2">
            {status.providers.serp.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                {p.configured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-white">{p.name}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {p.configured ? "configured" : "not configured"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
