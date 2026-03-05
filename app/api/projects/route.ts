import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queryMany, execute } from "@/lib/db";

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

// POST /api/projects — create project
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, url, niche, description } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const rows = await execute(
    `INSERT INTO hub_projects (name, url, niche, description, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, url || null, niche || null, description || null, session.user.id]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
