"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Bell,
  BellOff,
  Pause,
  Play,
  Loader2,
} from "lucide-react";

interface MonitorConfig {
  id: string;
  project_id: string;
  url: string;
  is_active: boolean;
  notify_telegram: boolean;
  last_status: string;
  last_checked_at: string | null;
  total_checks: number;
  down_checks: number;
}

interface CheckResult {
  id: string;
  status: string;
  status_code: number | null;
  response_time_ms: number;
  error_message: string | null;
  checked_at: string;
}

export default function MonitoringPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [configs, setConfigs] = useState<MonitorConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState("");

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch(`/api/monitoring/config?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchHistory = useCallback(async (configId: string) => {
    try {
      const res = await fetch(`/api/monitoring/history?configId=${configId}&limit=48`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  useEffect(() => {
    if (selectedConfig) {
      fetchHistory(selectedConfig);
    }
  }, [selectedConfig, fetchHistory]);

  const addUrl = async () => {
    setError("");
    if (!newUrl.trim()) return;

    let url = newUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    try {
      const res = await fetch("/api/monitoring/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, url }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ошибка добавления");
        return;
      }

      setNewUrl("");
      setShowAdd(false);
      fetchConfigs();
    } catch {
      setError("Ошибка сети");
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm("Удалить этот URL из мониторинга?")) return;

    await fetch(`/api/monitoring/config?configId=${configId}`, { method: "DELETE" });
    if (selectedConfig === configId) {
      setSelectedConfig(null);
      setHistory([]);
    }
    fetchConfigs();
  };

  const toggleConfig = async (configId: string, field: "is_active" | "notify_telegram", value: boolean) => {
    await fetch("/api/monitoring/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configId, [field]: value }),
    });
    fetchConfigs();
  };

  const checkNow = async (configId: string) => {
    setChecking(configId);
    try {
      await fetch("/api/monitoring/check-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId }),
      });
      fetchConfigs();
      if (selectedConfig === configId) {
        fetchHistory(configId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up":
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case "down":
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      up: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      down: "bg-red-500/10 text-red-400 border-red-500/20",
      unknown: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return styles[status as keyof typeof styles] || styles.unknown;
  };

  const getUptime = (config: MonitorConfig) => {
    if (!config.total_checks || config.total_checks === 0) return "—";
    const upChecks = config.total_checks - config.down_checks;
    return ((upChecks / config.total_checks) * 100).toFixed(1) + "%";
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-slate-500" size={24} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-[#DC2626]" />
            <h1 className="text-lg font-semibold text-slate-100">Мониторинг сайтов</h1>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm transition-colors"
        >
          <Plus size={14} />
          Добавить URL
        </button>
      </div>

      {/* Add URL form */}
      {showAdd && (
        <div className="rounded-xl border border-white/[0.08] bg-[#2a2b2d] p-4 space-y-3">
          <div className="flex gap-3">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
              onKeyDown={(e) => e.key === "Enter" && addUrl()}
            />
            <button
              onClick={addUrl}
              className="px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm transition-colors"
            >
              Добавить
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewUrl(""); setError(""); }}
              className="px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm transition-colors"
            >
              Отмена
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}

      {/* Monitors list */}
      {configs.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Activity size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Нет URL для мониторинга</p>
          <p className="text-xs mt-1">Добавьте URL чтобы начать отслеживать доступность</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`rounded-xl border bg-[#2a2b2d] p-4 transition-colors cursor-pointer ${
                selectedConfig === config.id
                  ? "border-[#DC2626]/30"
                  : "border-white/[0.08] hover:border-white/[0.1]"
              }`}
              onClick={() => setSelectedConfig(selectedConfig === config.id ? null : config.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {getStatusIcon(config.last_status)}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate font-mono">{config.url}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusBadge(config.last_status)}`}>
                        {config.last_status === "up" ? "Доступен" : config.last_status === "down" ? "Недоступен" : "Не проверен"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Uptime: {getUptime(config)}
                      </span>
                      {config.last_checked_at && (
                        <span className="text-[10px] text-slate-500">
                          Проверен: {formatTime(config.last_checked_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => checkNow(config.id)}
                    disabled={checking === config.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-white/5 transition-colors disabled:opacity-50"
                    title="Проверить сейчас"
                  >
                    {checking === config.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                  </button>
                  <button
                    onClick={() => toggleConfig(config.id, "notify_telegram", !config.notify_telegram)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      config.notify_telegram
                        ? "text-[#DC2626] hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
                    }`}
                    title={config.notify_telegram ? "Уведомления включены" : "Уведомления выключены"}
                  >
                    {config.notify_telegram ? <Bell size={14} /> : <BellOff size={14} />}
                  </button>
                  <button
                    onClick={() => toggleConfig(config.id, "is_active", !config.is_active)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      config.is_active
                        ? "text-emerald-400 hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-400 hover:bg-white/5"
                    }`}
                    title={config.is_active ? "Активен" : "Приостановлен"}
                  >
                    {config.is_active ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                  <button
                    onClick={() => deleteConfig(config.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/5 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* History panel */}
              {selectedConfig === config.id && history.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.08]">
                  <p className="text-xs text-slate-500 mb-2">Последние проверки</p>

                  {/* Mini timeline */}
                  <div className="flex gap-0.5 mb-3">
                    {history.slice(0, 48).reverse().map((check) => (
                      <div
                        key={check.id}
                        className={`flex-1 h-6 rounded-sm ${
                          check.status === "up" ? "bg-emerald-500/40" : "bg-red-500/40"
                        }`}
                        title={`${formatTime(check.checked_at)} — ${check.status === "up" ? "OK" : "DOWN"} ${check.response_time_ms}ms`}
                      />
                    ))}
                  </div>

                  {/* Recent checks table */}
                  <div className="space-y-1">
                    {history.slice(0, 10).map((check) => (
                      <div key={check.id} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          {check.status === "up" ? (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          ) : (
                            <XCircle size={12} className="text-red-400" />
                          )}
                          <span className="text-slate-400">{formatTime(check.checked_at)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {check.status_code && (
                            <span className="text-slate-500">{check.status_code}</span>
                          )}
                          <span className={`font-mono ${
                            check.response_time_ms < 500 ? "text-emerald-400" :
                            check.response_time_ms < 2000 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {check.response_time_ms}ms
                          </span>
                          {check.error_message && (
                            <span className="text-red-400 truncate max-w-[200px]">{check.error_message}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
