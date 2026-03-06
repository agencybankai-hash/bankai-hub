import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queryMany, queryOne } from "@/lib/db";

// GET /api/projects — list all projects
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await queryMany(
    `SELECT id, name, url, niche, description, status, updated_at
     FROM hub_projects ORDER BY updated_at DESC`
  );

  return NextResponse.json(projects);
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// POST /api/projects — create project
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, url, niche, description } = body;

  // Validation
  if (!name?.trim() || name.trim().length < 2) {
    return NextResponse.json({ error: "Название проекта — минимум 2 символа" }, { status: 400 });
  }

  if (name.trim().length > 100) {
    return NextResponse.json({ error: "Название слишком длинное (максимум 100 символов)" }, { status: 400 });
  }

  // URL validation — if provided, must be valid
  let cleanUrl: string | null = null;
  if (url && url.trim()) {
    let testUrl = url.trim();
    // Auto-add https:// if missing
    if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
      testUrl = "https://" + testUrl;
    }
    if (!isValidUrl(testUrl)) {
      return NextResponse.json({ error: "Некорректный URL. Пример: https://example.com" }, { status: 400 });
    }
    cleanUrl = testUrl;
  }

  // Always look up user by email to guarantee correct ID
  let userId: string | null = null;
  if (session.user.email) {
    const user = await queryOne<{ id: string }>(
      `SELECT id FROM hub_users WHERE email = $1`,
      [session.user.email]
    );
    userId = user?.id || null;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Пользователь не найден в базе данных" },
      { status: 400 }
    );
  }

  try {
    const result = await queryOne<{ id: string }>(
      `INSERT INTO hub_projects (name, url, niche, description, owner_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, url, niche, description, status, updated_at`,
      [name.trim(), cleanUrl, niche?.trim() || null, description?.trim() || null, userId]
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[API] Create project error:", err);
    return NextResponse.json(
      { error: "Ошибка создания проекта: " + (err.message || "unknown") },
      { status: 500 }
    );
  }
}
