import { queryMany, queryOne } from "@/lib/db";
import { Header } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { FolderKanban, Wrench, Users } from "lucide-react";
import Link from "next/link";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await queryMany(
    `SELECT * FROM hub_projects WHERE status = 'active' ORDER BY updated_at DESC LIMIT 5`
  );

  const projectCount = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM hub_projects`
  );

  const toolResultCount = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM hub_tool_results`
  );

  const teamCount = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM hub_users`
  );

  const stats = [
    { label: "Проекты", value: projectCount?.count ?? 0, icon: FolderKanban, href: "/projects" },
    { label: "Анализов", value: toolResultCount?.count ?? 0, icon: Wrench, href: "/tools" },
    { label: "Команда", value: teamCount?.count ?? 0, icon: Users, href: "/team" },
  ];

  return (
    <>
      <Header title="Дашборд" subtitle="Обзор платформы" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card hover>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#a78bfa]/10">
                    <s.icon size={20} className="text-[#a78bfa]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-100">
                      {s.value}
                    </p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent projects */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">
            Последние проекты
          </h2>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p: any) => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <Card hover>
                    <CardHeader>
                      <CardTitle>{p.name}</CardTitle>
                      <Badge
                        variant={
                          p.status === "active"
                            ? "success"
                            : p.status === "paused"
                            ? "warning"
                            : "default"
                        }
                      >
                        {p.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      {p.niche && (
                        <p className="text-xs text-slate-400 mb-1">{p.niche}</p>
                      )}
                      {p.url && (
                        <p className="text-xs text-[#a78bfa]/70 truncate">
                          {p.url}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        {formatRelative(p.updated_at)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <FolderKanban
                    size={32}
                    className="text-slate-600 mx-auto mb-2"
                  />
                  <p className="text-sm text-slate-400">
                    Пока нет проектов.{" "}
                    <Link
                      href="/projects"
                      className="text-[#a78bfa] hover:underline"
                    >
                      Создать первый
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
