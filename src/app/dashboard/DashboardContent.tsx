"use client";

/**
 * Habit Logic ダッシュボード: 固定順
 * ①勤怠 ②自分だけの学習 ③今日は何の日 ④今日のAI用語 ⑤本日のヘッドライン（1件）
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { PunchPanel } from "./PunchPanel";
import { TodayAiContent } from "./TodayAiContent";
import { getTodaysAiNews } from "@/lib/aiNews";
import { getTodaysSpecialDay } from "@/lib/specialDays";
import { getTodaysAiTerm } from "@/lib/aiTerms";
import { TOPICS } from "@/lib/topics";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Newspaper,
  Sparkles,
  ExternalLink,
  PlusCircle,
  BookOpen,
} from "lucide-react";

type TodayRecord = {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
};

type HistoryRecord = {
  clockIn: string | null;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
};

type AttendanceData = {
  today: TodayRecord;
  last7Dates: string[];
  historyByDate: Record<string, HistoryRecord>;
};

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const weekday = weekdays[d.getUTCDay()];
  return `${month}/${day}（${weekday}）`;
}

function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr || timeStr === "—") return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function calcGrossMinutes(
  clockIn: string | null,
  clockOut: string | null,
): number | null {
  const inM = parseTimeToMinutes(clockIn);
  const outM = parseTimeToMinutes(clockOut);
  if (inM == null || outM == null) return null;
  const diff = outM - inM;
  return diff > 0 ? diff : null;
}

function calcBreakMinutes(
  breakStart: string | null,
  breakEnd: string | null,
): number | null {
  const s = parseTimeToMinutes(breakStart);
  const e = parseTimeToMinutes(breakEnd);
  if (s == null || e == null) return null;
  const diff = e - s;
  return diff > 0 ? diff : null;
}

function calcActualWorkMinutes(
  clockIn: string | null,
  clockOut: string | null,
  breakStart: string | null,
  breakEnd: string | null,
): number | null {
  const gross = calcGrossMinutes(clockIn, clockOut);
  if (gross == null) return null;
  const breakM = calcBreakMinutes(breakStart, breakEnd) ?? 0;
  const actual = gross - breakM;
  return actual > 0 ? actual : null;
}

const CARD_CLASS =
  "rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_12px_rgba(30,41,59,0.06)] dark:border-slate-700 dark:bg-slate-900/50 dark:shadow-[0_2px_12px_rgba(0,0,0,0.15)]";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={CARD_CLASS}>
      <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-slate-200">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/** 本日のヘッドライン（最重要ニュース1件のみ） */
function HeadlineCard() {
  const news = useMemo(getTodaysAiNews, []);
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-600 dark:bg-slate-800/30">
      <div className="flex items-start gap-3">
        <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-[#1E293B] dark:text-slate-400" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#1E293B] dark:text-slate-200">
            {news.title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {news.summary}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {news.source && (
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {news.source}
              </span>
            )}
            {news.url && (
              <a
                href={news.url}
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

/** 今日は何の日 */
function SpecialDayCard() {
  const special = useMemo(getTodaysSpecialDay, []);
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
            今日は何の日
          </p>
          <p className="mt-1 text-sm font-medium text-amber-900 dark:text-amber-100">
            {special.name} — {special.description}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 今日のAI用語（簡潔な解説） */
function AiTermCard() {
  const term = useMemo(getTodaysAiTerm, []);
  return (
    <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-800/40 dark:bg-violet-950/20">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-violet-900 dark:text-violet-100">
            {term.term}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-violet-800/95 dark:text-violet-200/90">
            {term.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appliedPlanSummary, setAppliedPlanSummary] = useState<string>("");
  const [showAppliedPlan, setShowAppliedPlan] = useState(true);
  const [customQuizName, setCustomQuizName] = useState("");
  const [showSpecialDay, setShowSpecialDay] = useState(true);
  const [showAiNews, setShowAiNews] = useState(true);
  const [showAiTerm, setShowAiTerm] = useState(true);
  const [preferredTopicIds, setPreferredTopicIds] = useState<string[]>([]);
  const [customLearningGoal, setCustomLearningGoal] = useState("");

  const fetchSettings = useCallback(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.settings) {
          setAppliedPlanSummary(json.settings.appliedPlanSummary ?? "");
          setShowAppliedPlan(json.settings.showAppliedPlan ?? true);
          setCustomQuizName(json.settings.customQuizName ?? "");
          setShowSpecialDay(json.settings.showSpecialDay ?? true);
          setShowAiNews(json.settings.showAiNews ?? true);
          setShowAiTerm(json.settings.showAiTerm ?? true);
          setPreferredTopicIds(
            Array.isArray(json.settings.preferredTopicIds)
              ? json.settings.preferredTopicIds
              : [],
          );
          setCustomLearningGoal(json.settings.customLearningGoal ?? "");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const onFocus = () => fetchSettings();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchSettings]);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "勤怠データの取得に失敗しました。");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      toast.error(
        "通信エラーが発生しました。しばらく経ってからお試しください。",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E293B] border-t-transparent" />
      </div>
    );
  }

  const today = data?.today ?? {
    date: "",
    clockIn: null,
    clockOut: null,
    breakStart: null,
    breakEnd: null,
  };
  const last7Dates = data?.last7Dates ?? [];
  const historyByDate = data?.historyByDate ?? {};
  const actualMinutes = calcActualWorkMinutes(
    today.clockIn,
    today.clockOut,
    today.breakStart,
    today.breakEnd,
  );

  const status: "勤務中" | "休憩中" | "退勤済み" | null = today.clockIn
    ? today.clockOut
      ? "退勤済み"
      : today.breakStart && !today.breakEnd
        ? "休憩中"
        : "勤務中"
    : null;

  const hasPlan = !!(appliedPlanSummary && appliedPlanSummary.trim());
  const isSelectionOnly = !(customLearningGoal || "").trim();
  const learningCardTitle = (() => {
    if (preferredTopicIds?.length > 0 && isSelectionOnly) {
      const labels = TOPICS.filter((t) => preferredTopicIds.includes(t.id)).map(
        (t) => t.label,
      );
      if (labels.length > 0) return labels.join("・");
    }
    const custom = (customQuizName || "").trim();
    if (custom) return custom;
    if (preferredTopicIds?.length > 0) {
      const labels = TOPICS.filter((t) => preferredTopicIds.includes(t.id)).map(
        (t) => t.label,
      );
      return labels.length > 0 ? labels.join("・") : "今日のカスタムクイズ";
    }
    return "今日のカスタムクイズ";
  })();

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8">
      {/* ① 勤怠パネル（固定） */}
      <div className={CARD_CLASS}>
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-[#1E293B] dark:text-slate-200">
            打刻
          </h2>
        </div>
        <div className="p-5">
          {status && (
            <div className="mb-4 flex justify-center">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  status === "勤務中"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : status === "休憩中"
                      ? "bg-amber-500/15 text-amber-700"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "退勤済み"
                      ? "bg-slate-400"
                      : "animate-pulse bg-current"
                  }`}
                  aria-hidden
                />
                {status}
              </span>
            </div>
          )}
          <PunchPanel onSuccess={fetchAttendance} />
        </div>
      </div>

      {/* ② 自分だけのAI学習プラン or CTA */}
      {!hasPlan ? (
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#1E293B]/20 bg-slate-50/90 py-12 text-[#1E293B] transition hover:border-[#1E293B]/35 hover:bg-slate-100/90 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80"
        >
          <PlusCircle className="h-7 w-7 shrink-0 opacity-80" />
          <span className="text-lg font-semibold">
            ＋ 自分だけの学習プランを作成する
          </span>
        </Link>
      ) : (
        <Card title={learningCardTitle}>
          <TodayAiContent />
        </Card>
      )}

      {/* ③ 今日は何の日（設定で表示時のみ） */}
      {showSpecialDay && (
        <Card title="今日は何の日">
          <SpecialDayCard />
        </Card>
      )}

      {/* ④ 今日のAI用語（設定で表示時のみ） */}
      {showAiTerm && (
        <Card title="今日のAI用語">
          <AiTermCard />
        </Card>
      )}

      {/* ⑤ 本日のヘッドライン（最重要ニュース1件・設定で表示時のみ） */}
      {showAiNews && (
        <Card title="本日のヘッドライン（最重要ニュース）">
          <HeadlineCard />
        </Card>
      )}

      {hasPlan && showAppliedPlan && appliedPlanSummary && (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-4 shadow-[0_2px_12px_rgba(30,41,59,0.06)] dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs font-semibold text-[#1E293B] dark:text-slate-300">
            現在の学習プラン
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {appliedPlanSummary.slice(0, 140)}
            {appliedPlanSummary.length > 140 ? "…" : ""}
          </p>
        </div>
      )}

      {/* 勤怠状況・履歴 */}
      <section className={CARD_CLASS}>
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1E293B] dark:text-slate-200">
            <FileText className="h-4 w-4 text-[#1E293B] dark:text-slate-400" />
            勤怠状況（今日）
          </h2>
        </div>
        <div className="p-5">
          <p className="mb-3 text-xs font-medium text-slate-500">
            {today.date.replace(/-/g, "/")}
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    出勤
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    退勤
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    休憩
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                    実労働時間
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-3 tabular-nums font-medium text-slate-900 dark:text-slate-200">
                    {today.clockIn ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium text-slate-900 dark:text-slate-200">
                    {today.clockOut ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                    {today.breakStart ?? "—"} ～ {today.breakEnd ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold text-slate-900 dark:text-slate-200">
                    {actualMinutes != null
                      ? formatDuration(actualMinutes)
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="history" className={CARD_CLASS}>
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#1E293B] dark:text-slate-200">
            <Calendar className="h-4 w-4 text-[#1E293B] dark:text-slate-400" />
            打刻履歴（直近1週間）
          </h2>
        </div>
        <div className="p-5">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  日付
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  出勤
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  退勤
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  休憩
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                  実労働
                </th>
              </tr>
            </thead>
            <tbody>
              {last7Dates.map((date) => {
                const rec = historyByDate[date];
                const actual = calcActualWorkMinutes(
                  rec?.clockIn ?? null,
                  rec?.clockOut ?? null,
                  rec?.breakStart ?? null,
                  rec?.breakEnd ?? null,
                );
                return (
                  <tr
                    key={date}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-700"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">
                      {formatDisplayDate(date)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-900 dark:text-slate-200">
                      {rec?.clockIn ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-900 dark:text-slate-200">
                      {rec?.clockOut ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600 dark:text-slate-400">
                      {rec?.breakStart ?? "—"}～{rec?.breakEnd ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums font-medium text-slate-900 dark:text-slate-200">
                      {actual != null ? formatDuration(actual) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  );
}
