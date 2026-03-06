import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { execute } from "@/lib/db";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();

  await execute(
    `UPDATE hub_users SET name = $1 WHERE id = $2`,
    [name, session.user.id]
  );

  return NextResponse.json({ ok: true });
}
