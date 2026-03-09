"use client";

/**
 * インテリジェント・トップバナー: 「今日は何の日」と「AIデイリーニュース」を
 * 設定に応じて標準/詳細解説モードで表示する。
 */
import { useMemo } from "react";
import { Sparkles, Newspaper } from "lucide-react";
import { getTodaysSpecialDay } from "@/lib/specialDays";
import { getTodaysAiNews } from "@/lib/aiNews";

export type BannerSettings = {
  showSpecialDay: boolean;
  showAiNews: boolean;
  displayMode: "standard" | "detail_special" | "detail_news";
};

type Props = {
  settings: BannerSettings;
};

/** 情報コンテンツ用のカード共通スタイル（薄いブルー・グレー・読みやすいフォント） */
const cardBase =
  "rounded-xl border px-4 py-3 text-left shadow-sm transition";

export function IntelligentBanner({ settings }: Props) {
  const special = useMemo(getTodaysSpecialDay, []);
  const news = useMemo(getTodaysAiNews, []);

  const showSpecial = settings.showSpecialDay;
  const showNews = settings.showAiNews;
  const mode = settings.displayMode;

  const specialDetail = mode === "detail_special";
  const newsDetail = mode === "detail_news";

  const nothingToShow = !showSpecial && !showNews;
  if (nothingToShow) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* 今日は何の日 */}
      {showSpecial && (
        <div
          className={`${cardBase} border-amber-200/80 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/30`}
          role="region"
          aria-label="今日は何の日"
        >
          <div className="flex items-start gap-2">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                今日は何の日
              </p>
              {specialDetail && special.detail ? (
                <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                  <p className="font-medium">
                    {special.name} — {special.description}
                  </p>
                  {special.detail.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[13px] text-amber-800/95 dark:text-amber-200/90">
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-0.5 text-sm font-medium text-amber-900 dark:text-amber-100">
                  {special.name} — {special.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AIデイリーニュース */}
      {showNews && (
        <div
          className={`${cardBase} border-sky-200/80 bg-sky-50/80 dark:border-sky-800/40 dark:bg-sky-950/30`}
          role="region"
          aria-label="AIデイリーニュース"
        >
          <div className="flex items-start gap-2">
            <Newspaper
              className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sky-800 dark:text-sky-200">
                AIデイリーニュース
              </p>
              {newsDetail && news.detail ? (
                <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-sky-900 dark:text-sky-100">
                  <p className="font-medium">{news.title}</p>
                  <p className="text-[13px] text-sky-800/95 dark:text-sky-200/90">
                    {news.summary}
                  </p>
                  {news.detail.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[13px] text-sky-800/95 dark:text-sky-200/90">
                      {para}
                    </p>
                  ))}
                  {news.source && (
                    <p className="text-xs text-sky-600 dark:text-sky-400">
                      {news.source}
                      {news.category && ` ・ ${news.category}`}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-0.5 text-sm font-medium text-sky-900 dark:text-sky-100">
                    {news.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-sky-800/95 dark:text-sky-200/90">
                    {news.summary}
                  </p>
                  {(news.source || news.category) && (
                    <p className="mt-1 text-xs text-sky-600 dark:text-sky-400">
                      {[news.source, news.category].filter(Boolean).join(" ・ ")}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
