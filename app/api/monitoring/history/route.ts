import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { queryMany } from "@/lib/db";

// GET — история проверок для конфигурации
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const configId = searchParams.get("configId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  if (!configId) {
    return NextResponse.json({ error: "configId required" }, { status: 400 });
  }

  const checks = await queryMany(
    `SELECT id, status, status_code, response_time_ms, error_message, checked_at
     FROM hub_site_checks
     WHERE config_id = $1
     ORDER BY checked_at DESC
     LIMIT $2`,
    [configId, limit]
  );

  return NextResponse.json(checks);
}
