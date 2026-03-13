export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 0;

const TOYO_KEIZAI_RSS = "https://toyokeizai.net/list/feed/rss";
const ITMEDIA_TOP_RSS = "https://rss.itmedia.co.jp/rss/2.0/topstory.xml";
const ITMEDIA_NEWS_RSS = "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml";
const parser = new Parser({ timeout: 8000 });

const MIN_SUMMARY_LENGTH = 200;

const COMPLEMENT_SUFFIX =
  " この記事の詳細はリンク先でご確認ください。ニュースの概要は以上です。";

export type NewsItem = {
  id: string;
  title: string;
  description: string;
  summary: string;
  source: string;
  url: string;
  publishedAt?: string;
};

function stripHtml(s: string): string {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureMinLength(raw: string, title: string): string {
  const text = stripHtml(raw);
  if (text.length >= MIN_SUMMARY_LENGTH) {
    return text.substring(0, MIN_SUMMARY_LENGTH) + (text.length > MIN_SUMMARY_LENGTH ? "…" : "");
  }
  if (text.length > 0) {
    let out = text;
    while (out.length < MIN_SUMMARY_LENGTH) {
      out += COMPLEMENT_SUFFIX;
    }
    return out.substring(0, MIN_SUMMARY_LENGTH) + (out.length > MIN_SUMMARY_LENGTH ? "…" : "");
  }
  let fallback = `「${title}」についての記事です。`;
  while (fallback.length < MIN_SUMMARY_LENGTH) {
    fallback += COMPLEMENT_SUFFIX;
  }
  return fallback.substring(0, MIN_SUMMARY_LENGTH) + (fallback.length > MIN_SUMMARY_LENGTH ? "…" : "");
}

async function fetchNewsFromUrl(
  url: string,
  sourceName: string
): Promise<NewsItem | null> {
  const feed = await parser.parseURL(url);
  const item = feed.items?.[0];
  if (!item?.title || !item?.link) return null;
  const title = (item.title ?? "").trim();
  const content =
    (item.contentSnippet ?? item.content ?? item.description ?? "") || "";
  const summary = ensureMinLength(content, title);
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
