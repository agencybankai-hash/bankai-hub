import * as cheerio from "cheerio";
import { PageContent } from "./types";

const MAX_CONTENT_LENGTH = 50000;
const FETCH_TIMEOUT = 15000;

export async function parsePages(urls: string[]): Promise<PageContent[]> {
  const results = await Promise.allSettled(
    urls.map((url) => parseSinglePage(url))
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<PageContent> =>
        r.status === "fulfilled" && !!r.value.text
    )
    .map((r) => r.value);
}

export async function parseSinglePage(url: string): Promise<PageContent> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      redirect: "follow",
    });

    if (!resp.ok) {
      return emptyPage(url, `HTTP ${resp.status}`);
    }

    const html = await resp.text();
    return extractContent(url, html);
  } catch (e: any) {
    return emptyPage(url, e.message);
  }
}

function extractContent(url: string, html: string): PageContent {
  const $ = cheerio.load(html);

  // Remove noise
  $(
    "script, style, nav, footer, header, aside, noscript, iframe, .sidebar, .menu, .navigation, .ad, .advertisement"
  ).remove();

  // Title
  const title = $("title").first().text().trim();

  // H1
  const h1 = $("h1").first().text().trim();

  // Headings H2-H4
  const headings: { level: string; text: string }[] = [];
  $("h2, h3, h4").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2) {
      headings.push({ level: el.tagName, text });
    }
  });

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr("content") || "";

  // Main content - prioritize article > main > .content > body
  const mainEl =
    $("article").first().length > 0
      ? $("article").first()
      : $("main").first().length > 0
        ? $("main").first()
        : $('[class*="content"], [class*="article"], [class*="post"], [class*="entry"]')
              .first().length > 0
          ? $('[class*="content"], [class*="article"], [class*="post"], [class*="entry"]').first()
          : $("body");

  let text = mainEl.text() || "";

  // Clean text
  text = text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .filter((line) => line.trim().length > 1)
    .join("\n")
    .trim();

  if (text.length > MAX_CONTENT_LENGTH) {
    text = text.slice(0, MAX_CONTENT_LENGTH) + "\n...[truncated]";
  }

  const domain = new URL(url).hostname;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    url,
    domain,
    title,
    h1,
    headings: headings.slice(0, 30),
    metaDescription,
    text,
    wordCount,
  };
}

function emptyPage(url: string, error: string): PageContent {
  return {
    url,
    domain: "",
    title: "",
    h1: "",
    headings: [],
    metaDescription: "",
    text: "",
    wordCount: 0,
    error,
  };
}
