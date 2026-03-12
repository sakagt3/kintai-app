export const dynamic = "force-dynamic";
/**
 * 本日のニュースヘッドラインをRSSから取得。
 * タイトル＋記事冒頭150文字の要約（.substring(0,150)で強制抽出）をJSONで返す。
 */
import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 0;

const TOYO_KEIZAI_RSS = "https://toyokeizai.net/list/feed/rss";
const ITMEDIA_TOP_RSS = "https://rss.itmedia.co.jp/rss/2.0/topstory.xml";
const ITMEDIA_NEWS_RSS = "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml";
const parser = new Parser({ timeout: 8000 });

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  summary: string;
  source: string;
  url: string;
  publishedAt?: string;
};

const SUMMARY_LEN = 150;

/** description または content から先頭150文字を強制的に切り出す */
function forceSummary150(raw: string): string {
  const text = String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "詳細はリンク先をご覧ください。";
  return text.substring(0, SUMMARY_LEN) + (text.length > SUMMARY_LEN ? "…" : "");
}

async function fetchNewsFromUrl(
  url: string,
  sourceName: string
): Promise<NewsItem | null> {
  const feed = await parser.parseURL(url);
  const item = feed.items?.[0];
  if (!item?.title || !item?.link) return null;
  const title = (item.title ?? "").trim();
  const raw =
    (item.contentSnippet ?? item.content ?? item.description ?? "") || "";
  const summary = forceSummary150(raw);
  return {
    id: item.guid ?? item.link,
    title,
    description: summary,
    summary,
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
      return NextResponse.json({ news: null, error: "no_item" }, { status: 200 });
    }
    return NextResponse.json({ news });
  } catch (e) {
    console.error("[GET /api/news]", e);
    return NextResponse.json({ news: null, error: "fetch_failed" }, { status: 200 });
  }
}
