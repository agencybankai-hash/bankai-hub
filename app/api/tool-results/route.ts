import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { execute } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, toolSlug, query, result } = await request.json();

  const rows = await execute(
    `INSERT INTO hub_tool_results (project_id, tool_slug, query, result, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [projectId, toolSlug, query, JSON.stringify(result), session.user.id]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
