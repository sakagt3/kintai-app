"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink } from "lucide-react";

const FALLBACK_DESCRIPTION = "ニュースの詳細を確認するにはリンクをタップしてください";

type NewsItem = {
  id?: string;
  title?: string;
  summary?: string;
  description?: string;
  source?: string;
  url?: string;
  publishedAt?: string;
};

export function News() {
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((res) => res.json())
      .then((data: { news?: NewsItem | null }) => {
        if (!cancelled && data?.news) setItem(data.news);
      })
      .catch(() => {
        if (!cancelled) setItem(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-800/30">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Newspaper className="h-5 w-5 shrink-0 animate-pulse" />
          <span className="text-sm">ニュースを取得しています…</span>
        </div>
      </div>
    );
  }

  if (!item?.title) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-800/30">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Newspaper className="h-5 w-5 shrink-0" />
          <p className="text-sm">{FALLBACK_DESCRIPTION}</p>
        </div>
      </div>
    );
  }

  const description =
    (item.summary ?? item.description ?? "").trim() || FALLBACK_DESCRIPTION;
  const url = item.url ?? "";

  return (
    <div className="h-auto min-h-0 rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 dark:border-slate-600 dark:bg-slate-800/30 sm:p-4">
      <div className="flex items-start gap-3">
        <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-[#1E293B] dark:text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-[#1E293B] dark:text-slate-200 sm:text-sm">{item.title}</p>
          <p className="mt-2 line-clamp-[6] text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:leading-relaxed">
            {description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-3 sm:gap-2">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#1E293B]/30 bg-white px-3 py-2.5 text-sm font-medium text-[#1E293B] hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:min-h-0 sm:px-2.5 sm:py-1.5 sm:text-xs"
              >
                もっと読む
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{FALLBACK_DESCRIPTION}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
