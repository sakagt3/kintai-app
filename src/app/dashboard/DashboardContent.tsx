"use client";

/**
 * Habit Logic ダッシュボード: ①勤怠固定、以降はD&Dで並び替え可能（学習・今日は何の日・AI用語・ヘッドライン）
 * 本番でチャンク読み込み失敗を防ぐためカードは静的インポート。
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useMounted } from "@/hooks/useMounted";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PunchPanel } from "./PunchPanel";
import { TodayAiContent } from "./TodayAiContent";
import { News } from "@/components/News";
import { Anniversary } from "@/components/Anniversary";
import { AiTermCard } from "./cards/AiTermCard";
import { TOPICS } from "@/lib/topics";
import Link from "next/link";
import {
  FileText,
  Calendar,
  PlusCircle,
  GripVertical,
  BarChart3,
} from "lucide-react";

const CARD_ORDER_KEYS = ["specialDay", "aiTerm", "headline", "learning"] as const;
type CardId = (typeof CARD_ORDER_KEYS)[number];

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
  monthDates?: string[];
  monthlyByDate?: Record<string, HistoryRecord>;
};

/** 定時退社時刻（17:30）を分で表現 */
const REGULAR_END_MINUTES = 17 * 60 + 30;

/** 退勤時刻が定時を超えている場合の残業分数（超えていなければ 0） */
function calcOvertimeMinutes(clockOut: string | null): number {
  const out = parseTimeToMinutes(clockOut);
  if (out == null) return 0;
  if (out <= REGULAR_END_MINUTES) return 0;
  return out - REGULAR_END_MINUTES;
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr || typeof dateStr !== "string") return "—";
  const d = new Date(dateStr + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return "—";
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const w = d.getUTCDay();
  const weekday = weekdays[w] ?? "—";
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
  "min-w-0 w-full rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.08)] dark:border-slate-700 dark:bg-slate-900/50 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]";

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

function SortableCard({
  id,
  title,
  children,
}: {
  id: CardId;
  title: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${CARD_CLASS} ${isDragging ? "z-50 opacity-90 shadow-lg" : ""}`}
    >
      <div className="flex items-center border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:py-2.5">
        <button
          type="button"
          className="touch-none cursor-grab rounded p-1.5 text-slate-400 hover:bg-slate-100 active:cursor-grabbing dark:hover:bg-slate-800"
          aria-label="並び替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h2 className="ml-2 text-base font-semibold text-[#1E293B] dark:text-slate-200 sm:text-sm">
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function DashboardContent() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useMounted();
  const [appliedPlanSummary, setAppliedPlanSummary] = useState<string>("");
  const [showAppliedPlan, setShowAppliedPlan] = useState(true);
  const [customQuizName, setCustomQuizName] = useState("");
  const [showSpecialDay, setShowSpecialDay] = useState(true);
  const [showAiNews, setShowAiNews] = useState(true);
  const [showAiTerm, setShowAiTerm] = useState(true);
  const [preferredTopicIds, setPreferredTopicIds] = useState<string[]>([]);
  const [customLearningGoal, setCustomLearningGoal] = useState("");
  const [cardOrder, setCardOrder] = useState<CardId[]>([...CARD_ORDER_KEYS]);
  const [learningProgress, setLearningProgress] = useState<{
    masteredCount: number;
    totalCount: number;
    todayTotal: number;
    todayCorrect: number;
    isComplete: boolean;
  } | null>(null);

  const fetchSettings = useCallback(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const s = json?.settings;
        if (s) {
          setAppliedPlanSummary(s.appliedPlanSummary ?? "");
          setShowAppliedPlan(s.showAppliedPlan ?? true);
          setCustomQuizName(s.customQuizName ?? "");
          setShowSpecialDay(s.showSpecialDay ?? true);
          setShowAiNews(s.showAiNews ?? true);
          setShowAiTerm(s.showAiTerm ?? true);
          setPreferredTopicIds(
            Array.isArray(s.preferredTopicIds) ? s.preferredTopicIds : [],
          );
          setCustomLearningGoal(s.customLearningGoal ?? "");
          const order = s.dashboardCardOrder;
          if (Array.isArray(order) && order.length > 0) {
            const valid = order.filter((k) =>
              CARD_ORDER_KEYS.includes(k as CardId)
            ) as CardId[];
            const rest = CARD_ORDER_KEYS.filter((k) => !valid.includes(k));
            setCardOrder(valid.length > 0 ? [...valid, ...rest] : [...CARD_ORDER_KEYS]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchLearningProgress = useCallback(() => {
    fetch("/api/learning-progress", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        setLearningProgress({
          masteredCount: json.masteredCount ?? 0,
          totalCount: json.totalCount ?? 0,
          todayTotal: json.todayTotal ?? 0,
          todayCorrect: json.todayCorrect ?? 0,
          isComplete: json.isComplete ?? false,
        });
      })
      .catch(() => {});
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCardOrder((prev) => {
        const a = prev.indexOf(active.id as CardId);
        const b = prev.indexOf(over.id as CardId);
        if (a === -1 || b === -1) return prev;
        const next = arrayMove(prev, a, b);
        fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboardCardOrder: next }),
        }).then((res) => {
          if (res.ok) toast.success("並び順を保存しました");
        });
        return next;
      });
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchLearningProgress();
  }, [fetchSettings, fetchLearningProgress]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFocus = () => {
      fetchSettings();
      fetchLearningProgress();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchSettings]);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        setLoading(false);
        toast.error(json?.error ?? "勤怠データの取得に失敗しました。");
        return;
      }
      const body =
        json?.today != null || json?.last7Dates != null || json?.historyByDate != null
          ? {
              ...json,
              monthDates: json.monthDates ?? [],
              monthlyByDate: json.monthlyByDate ?? {},
            }
          : null;
      setData(body);
    } catch {
      setData(null);
      toast.error("通信エラーが発生しました。しばらく経ってからお試しください。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const hasPlan = !!(appliedPlanSummary && appliedPlanSummary.trim());
  const isSelectionOnly = !(customLearningGoal || "").trim();
  const learningCardTitle = useMemo(() => {
    const topics = Array.isArray(TOPICS) ? TOPICS : [];
    if (preferredTopicIds?.length > 0 && isSelectionOnly && topics.length > 0) {
      const labels = topics
        .filter((t) => t && preferredTopicIds.includes(t.id))
        .map((t) => t.label);
      if (labels.length > 0) return labels.join("・");
    }
    const custom = (customQuizName || "").trim();
    if (custom) return custom;
    if (preferredTopicIds?.length > 0 && topics.length > 0) {
      const labels = topics
        .filter((t) => t && preferredTopicIds.includes(t.id))
        .map((t) => t.label);
      return labels.length > 0 ? labels.join("・") : "今日のカスタムクイズ";
    }
    return "今日のカスタムクイズ";
  }, [preferredTopicIds, isSelectionOnly, customQuizName]);

  const visibleOrder = useMemo(() => {
    return cardOrder.filter((id) => {
      if (id === "learning") return true;
      if (id === "specialDay") return showSpecialDay;
      if (id === "aiTerm") return showAiTerm;
      if (id === "headline") return showAiNews;
      return false;
    });
  }, [cardOrder, showSpecialDay, showAiTerm, showAiNews]);

  const cardContent: Record<CardId, { title: string; content: React.ReactNode }> = useMemo(
    () => ({
      learning: {
        title: hasPlan ? learningCardTitle : "学習プラン",
        content: !hasPlan ? (
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center gap-2 py-4 text-[#1E293B] transition hover:opacity-90 dark:text-slate-200"
          >
            <PlusCircle className="h-5 w-5 shrink-0 opacity-80" />
            <span className="text-sm font-semibold">
              ＋ 自分だけの学習プランを作成する
            </span>
          </Link>
        ) : (
          <ErrorBoundary sectionName="学習プラン">
            <div className="space-y-4">
              {learningProgress && learningProgress.totalCount > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <BarChart3 className="h-3.5 w-3.5" />
                      学習進捗
                    </span>
                    {learningProgress.isComplete && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-400/20 dark:text-amber-100">
                        🎉 制覇！
                      </span>
                    )}
                  </div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span>
                      定着済み {learningProgress.masteredCount} / {learningProgress.totalCount} 問
                    </span>
                    <span>
                      今日: {learningProgress.todayCorrect} / {learningProgress.todayTotal} 正解
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    {(() => {
                      const ratio =
                        learningProgress.totalCount > 0
                          ? Math.min(
                              1,
                              learningProgress.masteredCount / learningProgress.totalCount,
                            )
                          : 0;
                      return (
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width]"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      );
                    })()}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Link
                      href="/dashboard/learning-log"
                      className="text-xs font-semibold text-[#1E293B] underline dark:text-slate-200"
                    >
                      学習ログを見る →
                    </Link>
                  </div>
                </div>
              )}
              <TodayAiContent />
            </div>
          </ErrorBoundary>
        ),
      },
      specialDay: {
        title: "今日は何の日",
        content: (
          <ErrorBoundary sectionName="今日は何の日">
            <Anniversary />
          </ErrorBoundary>
        ),
      },
      aiTerm: {
        title: "今日のAI用語",
        content: (
          <ErrorBoundary sectionName="今日のAI用語">
            <AiTermCard />
          </ErrorBoundary>
        ),
      },
      headline: {
        title: "本日のヘッドライン（最重要ニュース）",
        content: (
          <ErrorBoundary sectionName="ヘッドライン">
            <News />
          </ErrorBoundary>
        ),
      },
    }),
    [hasPlan, learningCardTitle]
  );

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
  const monthDates = data?.monthDates ?? [];
  const monthlyByDate = data?.monthlyByDate ?? {};
  const monthlyOvertimeMinutes = Object.entries(monthlyByDate).reduce(
    (sum, [, rec]) => sum + calcOvertimeMinutes(rec?.clockOut ?? null),
    0,
  );
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

  const todayLabel = (() => {
    const raw = today?.date || "";
    if (raw) {
      const d = new Date(raw + "T12:00:00Z");
      if (!Number.isNaN(d.getTime())) {
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth() + 1;
        const day = d.getUTCDate();
        const w = ["日", "月", "火", "水", "木", "金", "土"][d.getUTCDay()] ?? "";
        return `${y}年${m}月${day}日（${w}）`;
      }
    }
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const y = jst.getUTCFullYear();
    const m = jst.getUTCMonth() + 1;
    const day = jst.getUTCDate();
    const w = ["日", "月", "火", "水", "木", "金", "土"][jst.getUTCDay()] ?? "";
    return `${y}年${m}月${day}日（${w}）`;
  })();

  return (
    <div className="flex min-w-0 w-full max-w-full flex-1 flex-col gap-6 overflow-x-hidden px-4 py-4 sm:gap-8 sm:px-6 sm:py-6 md:px-8 md:py-8">
      {/* 今日の日付（西暦） */}
      <p className="text-base font-medium text-slate-600 dark:text-slate-400 sm:text-sm" aria-live="polite">
        {todayLabel}
      </p>
      {/* 勤怠取得失敗時は案内のみ表示し、画面はそのまま使えるようにする */}
      {!data && !loading && (
        <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
          勤怠データを読み込めませんでした。本番URL（Vercel の Domains に表示の Production）で開いているか確認し、必要なら再ログインしてください。
        </p>
      )}

      {/* ① 勤怠パネル（固定）・スマホは w-full＋grid-cols-2 でボタン潰れ防止 */}
      <div className={`${CARD_CLASS} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:py-2.5">
          <h2 className="text-base font-semibold text-[#1E293B] dark:text-slate-200 sm:text-sm">
            打刻
          </h2>
          <span className="text-xs font-medium tabular-nums text-slate-600 dark:text-slate-400">
            当月残業（定時17:30〜）{formatDuration(monthlyOvertimeMinutes)}
          </span>
        </div>
        <div className="w-full p-4 sm:p-4">
          {status && (
            <div className="mb-4 flex justify-center sm:mb-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:px-3 sm:py-1.5 sm:text-xs ${
                  status === "勤務中"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : status === "休憩中"
                      ? "bg-amber-500/15 text-amber-700"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
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

      {/* 並び替え可能カード（エラー時は一部だけ表示して本番で落ちないように） */}
      <ErrorBoundary
        sectionName="コンテンツカード"
        fallback={
          <div className={CARD_CLASS}>
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5">
              <h2 className="text-base font-semibold text-[#1E293B] dark:text-slate-200 sm:text-sm">
                コンテンツ
              </h2>
            </div>
            <div className="p-4 text-base text-slate-600 dark:text-slate-400 sm:p-5 sm:text-sm">
              一部コンテンツを読み込めませんでした。ページを再読み込みしてください。
            </div>
          </div>
        }
      >
        {!mounted ? (
          (Array.isArray(visibleOrder) ? visibleOrder : []).map((id) => {
            const entry = cardContent?.[id as CardId];
            if (!entry) return null;
            return (
              <div key={id} className={CARD_CLASS}>
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5">
                  <h2 className="text-base font-semibold text-[#1E293B] dark:text-slate-200 sm:text-sm">
                    {entry?.title ?? "—"}
                  </h2>
                </div>
                <div className="p-4 sm:p-5">{entry?.content ?? null}</div>
              </div>
            );
          })
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={Array.isArray(visibleOrder) ? visibleOrder : []}
              strategy={verticalListSortingStrategy}
            >
              {(Array.isArray(visibleOrder) ? visibleOrder : []).map((id) => {
                const entry = cardContent?.[id as CardId];
                if (!entry) return null;
                return (
                  <SortableCard key={id} id={id as CardId} title={entry.title ?? "—"}>
                    {entry.content}
                  </SortableCard>
                );
              })}
            </SortableContext>
          </DndContext>
        )}
      </ErrorBoundary>

      {hasPlan && showAppliedPlan && appliedPlanSummary?.trim() && (
        <div className="rounded-2xl border border-slate-200/80 border-l-4 border-l-indigo-400 bg-slate-50/80 px-4 py-4 shadow-[0_2px_12px_rgba(30,41,59,0.06)] dark:border-slate-700 dark:border-l-indigo-500 dark:bg-slate-800/50 sm:px-5">
          <p className="text-sm font-semibold text-[#1E293B] dark:text-slate-300 sm:text-xs">
            現在の学習プラン
          </p>
          <p className="mt-1.5 text-base leading-relaxed text-slate-700 dark:text-slate-300 sm:text-sm">
            {String(appliedPlanSummary).slice(0, 140)}
            {String(appliedPlanSummary).length > 140 ? "…" : ""}
          </p>
        </div>
      )}

      {/* 勤怠状況・カレンダー（見出し・ヘッダー高さを揃えたレイアウト） */}
      <section className={`${CARD_CLASS} overflow-hidden`}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-700 sm:px-5">
          <FileText className="h-4 w-4 shrink-0 text-[#1E293B] dark:text-slate-400" />
          <Calendar className="h-4 w-4 shrink-0 text-[#1E293B] dark:text-slate-400" />
          <h2 className="text-base font-semibold text-[#1E293B] dark:text-slate-200 sm:text-sm">
            勤怠状況・カレンダー
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          {/* 1行目: 月ラベルと「直近1週間」を同じ高さで横並び */}
          <div className="grid min-w-0 grid-cols-1 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-center sm:gap-6">
            <div className="flex h-9 items-center">
              {monthDates.length > 0 && monthDates[0] && (() => {
                const [y, m] = monthDates[0].split("-");
                return (
                  <span className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                    {y}年{m}月
                  </span>
                );
              })()}
            </div>
            <div className="flex h-9 items-center sm:justify-start">
              <span className="text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                直近1週間
              </span>
            </div>
          </div>

          {/* 2行目: カレンダーと表を同じ基準で並べる（曜日行と表ヘッダーを同じ高さに） */}
          <div className="mt-3 grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-[minmax(0,240px)_1fr] sm:gap-8">
            {/* 左: カレンダー */}
            {monthDates.length > 0 && (
              <div className="flex flex-col">
                {(() => {
                  const first = monthDates[0];
                  if (!first) return null;
                  const d0 = new Date(first + "T12:00:00Z");
                  const startWeekday = d0.getUTCDay();
                  const padding: null[] = Array(startWeekday).fill(null);
                  const todayStr = today?.date ?? "";
                  const HEADER_H = "h-8";
                  return (
                    <>
                      <div className={`grid grid-cols-7 gap-0.5 text-center text-xs ${HEADER_H}`}>
                        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
                          <div key={w} className="flex items-center justify-center font-medium text-slate-500 dark:text-slate-400">{w}</div>
                        ))}
                      </div>
                      <div className="mt-1 grid grid-cols-7 gap-0.5 text-center text-xs">
                        {[...padding, ...monthDates].map((date, i) => {
                          if (!date) return <div key={`pad-${i}`} className="h-7 w-7 sm:h-8 sm:w-8" />;
                          const rec = monthlyByDate[date];
                          const hasAttendance = !!(rec?.clockIn ?? rec?.clockOut);
                          const isToday = date === todayStr;
                          const dayNum = date.slice(8, 10).replace(/^0/, "");
                          return (
                            <div
                              key={date}
                              className={`flex h-7 w-7 items-center justify-center rounded-md tabular-nums sm:h-8 sm:w-8 ${
                                isToday ? "ring-2 ring-[#1E293B] ring-offset-1 dark:ring-slate-400 dark:ring-offset-slate-900" : ""
                              } ${hasAttendance ? "bg-emerald-500/25 font-semibold text-emerald-800 dark:bg-emerald-400/30 dark:text-emerald-100" : "text-slate-600 dark:text-slate-400"} ${isToday && !hasAttendance ? "bg-slate-100 dark:bg-slate-700/50" : ""}`}
                              title={hasAttendance ? `${date}: 打刻あり` : date}
                            >
                              {dayNum}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">緑＝打刻　枠＝今日</p>
                      <Link href="/dashboard/history" className="mt-3 text-xs font-medium text-[#1E293B] underline dark:text-slate-300">
                        打刻履歴を見る →
                      </Link>
                    </>
                  );
                })()}
              </div>
            )}
            {/* 右: 直近1週間テーブル（ヘッダー高さをカレンダー曜日行と揃える） */}
            <div className="min-w-0 overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800/30">
              <table className="w-full min-w-[200px] text-left text-sm">
                <thead>
                  <tr className="h-8 border-b border-slate-200 bg-slate-50/90 dark:border-slate-600 dark:bg-slate-800/50">
                    <th className="px-3 font-medium text-slate-600 dark:text-slate-400">日付</th>
                    <th className="px-3 font-medium text-slate-600 dark:text-slate-400">出勤</th>
                    <th className="px-3 font-medium text-slate-600 dark:text-slate-400">退勤</th>
                    <th className="px-3 font-medium text-slate-600 dark:text-slate-400">実労働</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(last7Dates) ? last7Dates : []).map((date) => {
                    const rec = historyByDate?.[date];
                    const actual = calcActualWorkMinutes(rec?.clockIn ?? null, rec?.clockOut ?? null, rec?.breakStart ?? null, rec?.breakEnd ?? null);
                    return (
                      <tr key={date} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{formatDisplayDate(date)}</td>
                        <td className="px-3 py-2 tabular-nums text-slate-900 dark:text-slate-200">{rec?.clockIn ?? "—"}</td>
                        <td className="px-3 py-2 tabular-nums text-slate-900 dark:text-slate-200">{rec?.clockOut ?? "—"}</td>
                        <td className="px-3 py-2 tabular-nums font-medium text-slate-900 dark:text-slate-200">{actual != null ? formatDuration(actual) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
