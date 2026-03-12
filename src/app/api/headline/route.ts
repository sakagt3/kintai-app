export const dynamic = "force-dynamic";
/**
 * 本日のヘッドライン（最重要ニュース）を公的・信頼できるRSSから1件取得。
 * 直接転載せず要約＋公式URLリンクのみ表示（引用の範囲で法的にクリーン）。
 */
import { NextResponse } from "next/server";
import Parser from "rss-parser";

const NHK_MAIN_RSS = "https://www.nhk.or.jp/rss/news/cat0.xml";
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

async function fetchHeadlineFromUrl(
  url: string,
  sourceName: string
): Promise<HeadlineItem | null> {
  const feed = await parser.parseURL(url);
  const item = feed.items?.[0];
  if (!item?.title || !item?.link) return null;
  const title = stripCdata(item.title ?? "").trim();
  const rawDesc =
    item.contentSnippet ?? item.content ?? item.description ?? "";
  const summary = stripCdata(rawDesc).trim().slice(0, 200);
  return {
    id: item.guid ?? item.link,
    title,
    summary: summary || "詳細はリンク先をご覧ください。",
    source: sourceName,
    url: item.link,
    publishedAt: item.pubDate ?? undefined,
  };
}

export async function GET() {
  try {
    const headline =
      (await fetchHeadlineFromUrl(NHK_MAIN_RSS, "NHK NEWS WEB").catch(() => null)) ??
      (await fetchHeadlineFromUrl(TOYO_KEIZAI_RSS, "東洋経済オンライン").catch(() => null));
    if (!headline) {
      return NextResponse.json(
        { headline: null, error: "no_item" },
        { status: 200 }
      );
    }
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
