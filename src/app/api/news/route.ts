/**
 * 本日のニュースヘッドラインを無料・登録不要のRSSから取得。
 * NHKは規約が厳しいため使用しない。見出し＋短い概要＋「詳細を読む」リンクのみ（引用の範囲で法的にクリーン）。
 * アクセスのたびにRSSを取得するため、毎日更新される仕組み。
 */
import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOYO_KEIZAI_RSS = "https://toyokeizai.net/list/feed/rss";
const ITMEDIA_TOP_RSS = "https://rss.itmedia.co.jp/rss/2.0/topstory.xml";
const ITMEDIA_NEWS_RSS = "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml";
const parser = new Parser({ timeout: 8000 });

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt?: string;
};

function stripCdata(s: string): string {
  const m = s.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return m ? m[1].trim() : s;
}

function toShortSummary(raw: string, maxLines = 3, maxLen = 300): string {
  const text = stripCdata(raw).trim().replace(/\s+/g, " ");
  const lines = text.split(/\n/).filter((l) => l.trim());
  const joined = lines.slice(0, maxLines).join(" ").slice(0, maxLen);
  return joined + (joined.length >= maxLen ? "…" : "");
}

async function fetchNewsFromUrl(
  url: string,
  sourceName: string
): Promise<NewsItem | null> {
  const feed = await parser.parseURL(url);
  const item = feed.items?.[0];
  if (!item?.title || !item?.link) return null;
  const title = stripCdata(item.title ?? "").trim();
  const rawDesc =
    item.contentSnippet ?? item.content ?? item.description ?? "";
  const description =
    toShortSummary(rawDesc) || "詳細はリンク先をご覧ください。";
  return {
    id: item.guid ?? item.link,
    title,
    description,
    source: sourceName,
    url: item.link,
    publishedAt: item.pubDate ?? undefined,
  };
}

export async function GET() {
  try {
    const news =
      (await fetchNewsFromUrl(TOYO_KEIZAI_RSS, "東洋経済オンライン").catch(() => null)) ??
      (await fetchNewsFromUrl(ITMEDIA_TOP_RSS, "ITmedia").catch(() => null)) ??
      (await fetchNewsFromUrl(ITMEDIA_NEWS_RSS, "ITmedia NEWS").catch(() => null));
    if (!news) {
      return NextResponse.json(
        { news: null, error: "no_item" },
        { status: 200 }
      );
    }
    return NextResponse.json({ news });
  } catch (e) {
    console.error("[GET /api/news]", e);
    return NextResponse.json(
      { news: null, error: "fetch_failed" },
      { status: 200 }
    );
  }
}
