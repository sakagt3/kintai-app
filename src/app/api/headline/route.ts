/**
 * 本日のヘッドライン（最重要ニュース）を東洋経済オンラインRSSから取得して返す
 */
import { NextResponse } from "next/server";
import Parser from "rss-parser";

const TOYO_KEIZAI_RSS = "https://toyokeizai.net/list/feed/rss";
const parser = new Parser({ timeout: 8000 });

export type HeadlineItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt?: string;
};

export async function GET() {
  try {
    const feed = await parser.parseURL(TOYO_KEIZAI_RSS);
    const item = feed.items?.[0];
    if (!item?.title || !item?.link) {
      return NextResponse.json(
        { headline: null, error: "no_item" },
        { status: 200 }
      );
    }
    const title = stripCdata(item.title ?? "").trim();
    const summary = stripCdata(item.contentSnippet ?? item.content ?? item.description ?? "").trim().slice(0, 200);
    const headline: HeadlineItem = {
      id: item.guid ?? item.link,
      title,
      summary: summary || "詳細はリンク先をご覧ください。",
      source: "東洋経済オンライン",
      url: item.link,
      publishedAt: item.pubDate ?? undefined,
    };
    return NextResponse.json({ headline });
  } catch (e) {
    console.error("[headline] RSS fetch error:", e);
    return NextResponse.json(
      { headline: null, error: "fetch_failed" },
      { status: 200 }
    );
  }
}

function stripCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1].trim() : s;
}
