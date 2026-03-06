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
    `INSERT INTO hub_tool_results (project_id, tool_slug, query, result)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [projectId, toolSlug, query, JSON.stringify(result)]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
