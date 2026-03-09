"use client";

/**
 * インテリジェント・トップバナー: 今日は何の日・AIニュース・AI用語（営業向け）を
 * 設定に応じて表示。ニュースは出典リンク付き「詳細を見る」対応。
 */
import { useMemo } from "react";
import { Sparkles, Newspaper, BookOpen, ExternalLink } from "lucide-react";
import { getTodaysSpecialDay } from "@/lib/specialDays";
import { getTodaysAiNews } from "@/lib/aiNews";
import { getTodaysAiTerm } from "@/lib/aiTerms";

export type BannerSettings = {
  showSpecialDay: boolean;
  showAiNews: boolean;
  showAiTerm?: boolean;
  displayMode: "standard" | "detail_special" | "detail_news";
  displayVolume?: "simple" | "detailed";
};

type Props = {
  settings: BannerSettings;
};

const cardBase =
  "rounded-xl border px-4 py-3 text-left shadow-sm transition";

export function IntelligentBanner({ settings }: Props) {
  const special = useMemo(getTodaysSpecialDay, []);
  const news = useMemo(getTodaysAiNews, []);
  const aiTerm = useMemo(getTodaysAiTerm, []);

  const showSpecial = settings.showSpecialDay;
  const showNews = settings.showAiNews;
  const showTerm = settings.showAiTerm ?? true;
  const volume = settings.displayVolume ?? "simple";
  const isDetailed = volume === "detailed";

  const specialDetail = settings.displayMode === "detail_special" || isDetailed;
  const newsDetail = settings.displayMode === "detail_news" || isDetailed;

  const nothingToShow = !showSpecial && !showNews && !showTerm;
  if (nothingToShow) return null;

  return (
    <div className="flex flex-col gap-4">
      {showSpecial && (
        <div
          className={`${cardBase} border-amber-200/80 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/30`}
          role="region"
          aria-label="今日は何の日"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">今日は何の日</p>
              {specialDetail && special.detail ? (
                <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                  <p className="font-medium">{special.name} — {special.description}</p>
                  {special.detail.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[13px] text-amber-800/95 dark:text-amber-200/90">{para}</p>
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

      {showNews && (
        <div
          className={`${cardBase} border-sky-200/80 bg-sky-50/80 dark:border-sky-800/40 dark:bg-sky-950/30`}
          role="region"
          aria-label="AIデイリーニュース"
        >
          <div className="flex items-start gap-2">
            <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sky-800 dark:text-sky-200">AIデイリーニュース</p>
              {newsDetail && news.detail ? (
                <div className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-sky-900 dark:text-sky-100">
                  <p className="font-medium">{news.title}</p>
                  <p className="text-[13px] text-sky-800/95 dark:text-sky-200/90">{news.summary}</p>
                  {news.detail.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[13px] text-sky-800/95 dark:text-sky-200/90">{para}</p>
                  ))}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {news.source && (
                      <span className="text-xs text-sky-600 dark:text-sky-400">
                        {news.source}{news.category && ` ・ ${news.category}`}
                      </span>
                    )}
                    {news.url && (
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        気になったら詳細を見る
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-0.5 text-sm font-medium text-sky-900 dark:text-sky-100">{news.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-sky-800/95 dark:text-sky-200/90">{news.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {(news.source || news.category) && (
                      <span className="text-xs text-sky-600 dark:text-sky-400">
                        {[news.source, news.category].filter(Boolean).join(" ・ ")}
                      </span>
                    )}
                    {news.url && (
                      <a
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        気になったら詳細を見る
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showTerm && (
        <div
          className={`${cardBase} border-violet-200/80 bg-violet-50/80 dark:border-violet-800/40 dark:bg-violet-950/30`}
          role="region"
          aria-label="AI用語解説（営業用）"
        >
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">今日のAI用語（営業で使える）</p>
              <p className="mt-0.5 text-sm font-bold text-violet-900 dark:text-violet-100">{aiTerm.term}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-violet-800/95 dark:text-violet-200/90">{aiTerm.explanation}</p>
              {isDetailed && (
                <>
                  <p className="mt-2 text-xs font-semibold text-violet-700 dark:text-violet-300">お客様への説明例</p>
                  <p className="mt-0.5 text-[13px] italic text-violet-800/90 dark:text-violet-200/85">{aiTerm.talkExample}</p>
                  <p className="mt-2 text-xs font-semibold text-violet-700 dark:text-violet-300">ビジネスでの使用用途</p>
                  <p className="mt-0.5 text-[13px] text-violet-800/90 dark:text-violet-200/85">{aiTerm.businessUse}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
