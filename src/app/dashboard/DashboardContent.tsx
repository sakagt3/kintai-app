"use client";

/**
 * Habit Logic ダッシュボード: ①勤怠固定、以降はD&Dで並び替え可能（学習・今日は何の日・AI用語・ヘッドライン）
 * カード類は next/dynamic で ssr: false にして Hydration エラーを防止。
 */
import dynamic from "next/dynamic";
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
import { TOPICS } from "@/lib/topics";
import Link from "next/link";
import {
  FileText,
  Calendar,
  PlusCircle,
  GripVertical,
} from "lucide-react";

const LoadingCard = () => (
  <div className="min-h-[100px] rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-center dark:border-slate-700 dark:bg-slate-800/30">
    <span className="text-sm text-slate-400">読み込み中…</span>
  </div>
);
const TodayAiContent = dynamic(() => import("./TodayAiContent").then((m) => ({ default: m.TodayAiContent })), { ssr: false, loading: LoadingCard });
const HeadlineCard = dynamic(() => import("./cards/HeadlineCard").then((m) => ({ default: m.HeadlineCard })), { ssr: false, loading: LoadingCard });
const SpecialDayCard = dynamic(() => import("./cards/SpecialDayCard").then((m) => ({ default: m.SpecialDayCard })), { ssr: false, loading: LoadingCard });
const AiTermCard = dynamic(() => import("./cards/AiTermCard").then((m) => ({ default: m.AiTermCard })), { ssr: false, loading: LoadingCard });

const CARD_ORDER_KEYS = ["learning", "specialDay", "aiTerm", "headline"] as const;
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
};

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
      <div className="flex items-center border-b border-slate-100 px-4 py-2.5 dark:border-slate-700">
        <button
          type="button"
          className="touch-none cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing dark:hover:bg-slate-800"
          aria-label="並び替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h2 className="ml-2 text-sm font-semibold text-[#1E293B] dark:text-slate-200">
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
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
        toast.error(json?.error ?? "勤怠データの取得に失敗しました。");
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
            <TodayAiContent />
          </ErrorBoundary>
        ),
      },
      specialDay: {
        title: "今日は何の日",
        content: (
          <ErrorBoundary sectionName="今日は何の日">
            <SpecialDayCard />
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
            <HeadlineCard />
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
    const n = new Date();
    const y = n.getFullYear();
    const m = n.getMonth() + 1;
    const day = n.getDate();
    const w = ["日", "月", "火", "水", "木", "金", "土"][n.getDay()] ?? "";
    return `${y}年${m}月${day}日（${w}）`;
  })();

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8">
      {/* 今日の日付（西暦） */}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400" aria-live="polite">
        {todayLabel}
      </p>

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

      {/* 並び替え可能カード（クライアントマウント後のみ DnD 有効で Hydration エラー防止） */}
      {!mounted ? (
        (Array.isArray(visibleOrder) ? visibleOrder : []).map((id) => {
          const entry = cardContent?.[id as CardId];
          if (!entry) return null;
          return (
            <div key={id} className={CARD_CLASS}>
              <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-[#1E293B] dark:text-slate-200">
                  {entry?.title ?? "—"}
                </h2>
              </div>
              <div className="p-5">{entry?.content ?? null}</div>
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

      {hasPlan && showAppliedPlan && appliedPlanSummary?.trim() && (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-4 shadow-[0_2px_12px_rgba(30,41,59,0.06)] dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs font-semibold text-[#1E293B] dark:text-slate-300">
            現在の学習プラン
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {String(appliedPlanSummary).slice(0, 140)}
            {String(appliedPlanSummary).length > 140 ? "…" : ""}
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
            {today.date ? String(today.date).replace(/-/g, "/") : "—"}
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
              {(Array.isArray(last7Dates) ? last7Dates : []).map((date) => {
                const rec = historyByDate?.[date];
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
