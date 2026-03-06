"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout";
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Badge, Modal, Textarea,
} from "@/components/ui";
import { Plus, Search, FolderKanban } from "lucide-react";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  url: string | null;
  niche: string | null;
  description: string | null;
  status: string;
  updated_at: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formNiche, setFormNiche] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        console.error("Failed to fetch projects:", res.status);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch projects error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          url: formUrl || null,
          niche: formNiche || null,
          description: formDesc || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ошибка создания проекта");
        setSaving(false);
        return;
      }

      // Success — reset form and refresh
      setFormName("");
      setFormUrl("");
      setFormNiche("");
      setFormDesc("");
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.niche && p.niche.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Header
        title="Проекты"
        subtitle={`${projects.length} проектов`}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Новый проект
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Поиск проектов..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-[#DC2626]/50 focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 py-12 text-center">Загрузка...</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card hover>
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <Badge variant={p.status === "active" ? "success" : p.status === "paused" ? "warning" : "default"}>
                      {p.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {p.niche && <p className="text-xs text-slate-400 mb-1">{p.niche}</p>}
                    {p.url && <p className="text-xs text-[#DC2626]/70 truncate">{p.url}</p>}
                    <p className="text-xs text-slate-500 mt-2">{formatRelative(p.updated_at)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <FolderKanban size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">{search ? "Ничего не найдено" : "Нет проектов"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(""); }} title="Новый проект">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            id="name"
            label="Название *"
            placeholder="DECA Windows & Doors"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            id="url"
            label="URL сайта"
            placeholder="https://example.com"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
          />
          <Input
            id="niche"
            label="Ниша"
            placeholder="e-commerce, медицина, финансы..."
            value={formNiche}
            onChange={(e) => setFormNiche(e.target.value)}
          />
          <Textarea
            id="desc"
            label="Описание"
            placeholder="Краткое описание проекта..."
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setError(""); }}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>Создать</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
