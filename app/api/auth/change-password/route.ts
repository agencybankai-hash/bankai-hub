import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const sql = getDb();
  const rows = await sql(
    `SELECT password_hash FROM hub_users WHERE id = $1`,
    [session.user.id]
  );

  if (!rows[0]) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash as string);
  if (!valid) {
    return NextResponse.json({ error: "Wrong current password" }, { status: 403 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await sql(`UPDATE hub_users SET password_hash = $1 WHERE id = $2`, [
    hash,
    session.user.id,
  ]);

  return NextResponse.json({ ok: true });
}
