import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

// Temporary setup endpoint — DELETE after first use!
export async function GET() {
  try {
    const password = "bankai2024";
    const hash = await bcrypt.hash(password, 12);

    // Upsert admin user
    await sql(
      `INSERT INTO hub_users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2`,
      ["agency.bankai@gmail.com", hash, "Bankai Admin", "admin"]
    );

    return NextResponse.json({ ok: true, message: "Admin user created/updated" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
