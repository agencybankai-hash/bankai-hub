import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    env_check: {
      XMLRIVER_USER: process.env.XMLRIVER_USER ? `SET (${process.env.XMLRIVER_USER.length} chars)` : "MISSING",
      XMLRIVER_KEY: process.env.XMLRIVER_KEY ? `SET (${process.env.XMLRIVER_KEY.length} chars)` : "MISSING",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? `SET (${process.env.ANTHROPIC_API_KEY.length} chars)` : "MISSING",
    },
    timestamp: new Date().toISOString(),
  });
}
