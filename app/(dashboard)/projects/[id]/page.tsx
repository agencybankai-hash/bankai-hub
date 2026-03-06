import { queryOne, queryMany } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout";
import { Card, CardContent, Badge } from "@/components/ui";
import { toolRegistry } from "@/lib/tools/registry";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  const project = await queryOne(
    `SELECT * FROM hub_projects WHERE id = $1`,
    [id]
  );

  if (!project) notFound();

  const results = await queryMany(
    `SELECT id, tool_slug, query, created_at FROM hub_tool_results
     WHERE project_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [id]
  );

  return (
    <>
      <Header
        title={project.name}
        subtitle={project.niche || project.url || undefined}
      />

      <div className="p-6 space-y-6">
        {/* Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Информация</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Статус</dt>
                  <dd>
                    <Badge variant={project.status === "active" ? "success" : project.status === "paused" ? "warning" : "default"}>
                      {project.status}
                    </Badge>
                  </dd>
                </div>
                {project.url && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">URL</dt>
                    <dd className="text-blue-400 truncate max-w-[200px]">{project.url}</dd>
                  </div>
                )}
                {project.target_audience && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Аудитория</dt>
                    <dd className="text-slate-300 truncate max-w-[200px]">{project.target_audience}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Язык / Регион</dt>
                  <dd className="text-slate-300">{project.language} / {project.region}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Создан</dt>
                  <dd className="text-slate-300">{formatDate(project.created_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {project.description && (
            <Card>
              <CardContent>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Описание</h3>
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tools */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Инструменты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {toolRegistry.map((tool) => {
              const isActive = tool.status === "active";
              // site-monitor ведёт на отдельную страницу мониторинга
              const toolHref = tool.slug === "site-monitor"
                ? `/projects/${id}/monitoring`
                : `/projects/${id}/tools/${tool.slug}`;
              return isActive ? (
                <Link key={tool.slug} href={toolHref}>
                  <Card hover className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <tool.icon size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{tool.name}</p>
                      <p className="text-xs text-slate-500 truncate">{tool.description}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-500 shrink-0" />
                  </Card>
                </Link>
              ) : (
                <Card key={tool.slug} className="flex items-center gap-3 opacity-50">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <tool.icon size={18} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-400">{tool.name}</p>
                    <p className="text-xs text-slate-600">Скоро</p>
                  </div>
                  <Lock size={14} className="text-slate-600 shrink-0" />
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent results */}
        {results.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Последние анализы</h2>
            <Card>
              <CardContent>
                <div className="divide-y divide-white/[0.06]">
                  {results.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm text-slate-200">{r.query}</p>
                        <p className="text-xs text-slate-500">{r.tool_slug} · {formatDate(r.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
