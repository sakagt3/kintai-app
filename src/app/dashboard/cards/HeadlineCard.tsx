"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink } from "lucide-react";

type HeadlineItem = {
  id: string;
  title: string;
  summary: string;
  source?: string;
  url?: string;
  publishedAt?: string;
};

export function HeadlineCard() {
  const [headline, setHeadline] = useState<HeadlineItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/headline")
      .then((res) => res.json())
      .then((data: { headline?: HeadlineItem | null }) => {
        if (!cancelled && data?.headline) setHeadline(data.headline);
      })
      .catch(() => {
        if (!cancelled) setHeadline(null);
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

  if (!headline?.title) return null;

  const title = headline.title;
  const summary = headline.summary ?? "—";
  const source = headline.source;
  const url = headline.url;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-800/30">
      <div className="flex items-start gap-3">
        <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-[#1E293B] dark:text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#1E293B] dark:text-slate-200">
            {title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {source != null && source !== "" && (
              <span className="text-xs text-slate-500 dark:text-slate-500">
                出典：{source}
              </span>
            )}
            {url != null && url !== "" && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E293B]/30 bg-white px-2.5 py-1.5 text-xs font-medium text-[#1E293B] hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                詳細を見る
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
