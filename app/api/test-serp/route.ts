import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = process.env.XMLRIVER_USER;
  const key = process.env.XMLRIVER_KEY;

  if (!user || !key) {
    return NextResponse.json({ error: "XMLRIVER credentials missing" });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "kitchen cabinet refacing";

  const url = new URL("https://xmlriver.com/search/xml");
  url.searchParams.set("user", user);
  url.searchParams.set("key", key);
  url.searchParams.set("query", query);
  url.searchParams.set("groupby", "10");

  try {
    const resp = await fetch(url.toString(), {
      signal: AbortSignal.timeout(30000),
    });

    const status = resp.status;
    const text = await resp.text();

    return NextResponse.json({
      xmlriver_url: url.toString().replace(key, "***").replace(user, "***"),
      http_status: status,
      response_length: text.length,
      response_first_2000: text.slice(0, 2000),
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({
      error: e.message,
      xmlriver_url: url.toString().replace(key, "***").replace(user, "***"),
    });
  }
}
