import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queryMany, queryOne, execute } from "@/lib/db";

// GET — список конфигураций мониторинга для проекта
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const configs = await queryMany(
    `SELECT mc.*,
            (SELECT COUNT(*) FROM hub_site_checks sc WHERE sc.config_id = mc.id) as total_checks,
            (SELECT COUNT(*) FROM hub_site_checks sc WHERE sc.config_id = mc.id AND sc.status = 'down') as down_checks
     FROM hub_monitoring_config mc
     WHERE mc.project_id = $1
     ORDER BY mc.created_at DESC`,
    [projectId]
  );

  return NextResponse.json(configs);
}

// POST — добавить URL для мониторинга
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, url } = body;

  if (!projectId || !url) {
    return NextResponse.json({ error: "projectId and url are required" }, { status: 400 });
  }

  // Валидация URL
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Проверяем дубликат
  const existing = await queryOne(
    `SELECT id FROM hub_monitoring_config WHERE project_id = $1 AND url = $2`,
    [projectId, url]
  );

  if (existing) {
    return NextResponse.json({ error: "URL already monitored for this project" }, { status: 409 });
  }

  const result = await queryOne(
    `INSERT INTO hub_monitoring_config (project_id, url)
     VALUES ($1, $2)
     RETURNING *`,
    [projectId, url]
  );

  return NextResponse.json(result, { status: 201 });
}

// PATCH — обновить конфигурацию
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { configId, is_active, notify_telegram } = body;

  if (!configId) {
    return NextResponse.json({ error: "configId required" }, { status: 400 });
  }

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (typeof is_active === "boolean") {
    updates.push(`is_active = $${idx++}`);
    params.push(is_active);
  }
  if (typeof notify_telegram === "boolean") {
    updates.push(`notify_telegram = $${idx++}`);
    params.push(notify_telegram);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  params.push(configId);
  const result = await queryOne(
    `UPDATE hub_monitoring_config SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
    params
  );

  return NextResponse.json(result);
}

// DELETE — удалить конфигурацию
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const configId = searchParams.get("configId");

  if (!configId) {
    return NextResponse.json({ error: "configId required" }, { status: 400 });
  }

  await execute(`DELETE FROM hub_monitoring_config WHERE id = $1`, [configId]);

  return NextResponse.json({ ok: true });
}
