"use client";

/**
 * HabitLogic ダッシュボード: 打刻固定、3カード（クイズ・ニュース・今日は何の日）をドラッグで並び替え。
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
import { PunchPanel } from "./PunchPanel";
import { TodayAiContent } from "./TodayAiContent";
import { getTodaysAiNews } from "@/lib/aiNews";
import { getTodaysSpecialDay } from "@/lib/specialDays";
import type { BannerSettings } from "./IntelligentBanner";
import Link from "next/link";
import { FileText, Calendar, GripVertical, Newspaper, Sparkles, ExternalLink, PlusCircle } from "lucide-react";

const CARD_ORDER_KEYS = ["quiz", "news", "specialDay"] as const;
type CardId = (typeof CARD_ORDER_KEYS)[number];

const DEFAULT_ORDER_WITH_PLAN: CardId[] = ["quiz", "news", "specialDay"];
const DEFAULT_ORDER_NO_PLAN: CardId[] = ["news", "specialDay"];

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

const DEFAULT_BANNER_SETTINGS: BannerSettings = {
  showSpecialDay: true,
  showAiNews: true,
  showAiTerm: true,
  displayMode: "standard",
  displayVolume: "simple",
};

function SortableCard({
  id,
  children,
  title,
}: {
  id: CardId;
  children: React.ReactNode;
  title: string;
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
      className={`rounded-xl border border-gray-200/90 bg-white shadow-sm ${isDragging ? "z-50 opacity-90" : ""}`}
    >
      <div className="flex items-center border-b border-gray-100 px-4 py-2">
        <button
          type="button"
          className="touch-none cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 active:cursor-grabbing"
          aria-label="並び替え"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h2 className="ml-2 text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** 今日のAIトピック（ニュース）: 要約と出典リンクのみ */
function NewsTopicCard() {
  const news = useMemo(getTodaysAiNews, []);
  return (
    <div className="rounded-lg border border-sky-200/80 bg-sky-50/50 p-3">
      <div className="flex items-start gap-2">
        <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-sky-900">{news.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-sky-800/90">
            {news.summary}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {news.source && (
              <span className="text-xs text-sky-600">{news.source}</span>
            )}
            {news.url && (
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
              >
                詳細を見る
                <ExternalLink className="h-3 w-3" />
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
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-amber-800">今日は何の日</p>
          <p className="mt-0.5 text-sm font-medium text-amber-900">
            {special.name} — {special.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DashboardContent() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerSettings, setBannerSettings] =
    useState<BannerSettings>(DEFAULT_BANNER_SETTINGS);
  const [appliedPlanSummary, setAppliedPlanSummary] = useState<string>("");
  const [showAppliedPlan, setShowAppliedPlan] = useState(true);
  const [customQuizName, setCustomQuizName] = useState("");
  const [cardOrder, setCardOrder] = useState<CardId[]>([...CARD_ORDER_KEYS]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.settings) {
          setBannerSettings({
            showSpecialDay: json.settings.showSpecialDay ?? true,
            showAiNews: json.settings.showAiNews ?? true,
            showAiTerm: json.settings.showAiTerm ?? true,
            displayMode: json.settings.displayMode ?? "standard",
            displayVolume: json.settings.displayVolume ?? "simple",
          });
          setAppliedPlanSummary(json.settings.appliedPlanSummary ?? "");
          setShowAppliedPlan(json.settings.showAppliedPlan ?? true);
          setCustomQuizName(json.settings.customQuizName ?? "");
          const order = json.settings.dashboardCardOrder;
          if (Array.isArray(order) && order.length > 0) {
            const valid = order.filter((k) =>
              CARD_ORDER_KEYS.includes(k as CardId)
            ) as CardId[];
            const rest = CARD_ORDER_KEYS.filter((k) => !valid.includes(k));
            setCardOrder(valid.length > 0 ? [...valid, ...rest] : DEFAULT_ORDER_WITH_PLAN);
          }
        }
      })
      .catch(() => {});
  }, []);

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

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
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
  const quizCardTitle = (customQuizName || "今日のカスタムクイズ").trim() || "今日のカスタムクイズ";
  const visibleCardOrder = hasPlan ? cardOrder : DEFAULT_ORDER_NO_PLAN;

  const cardMap: Record<CardId, { title: string; content: React.ReactNode }> = {
    quiz: {
      title: quizCardTitle,
      content: <TodayAiContent />,
    },
    news: {
      title: "今日のAIトピック（ニュース）",
      content: <NewsTopicCard />,
    },
    specialDay: {
      title: "今日は何の日",
      content: <SpecialDayCard />,
    },
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* 最上部: 打刻固定・余白詰め */}
      <div className="rounded-xl border border-gray-200/90 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-2">
          <h2 className="text-sm font-semibold text-gray-800">打刻</h2>
        </div>
        <div className="p-4">
          {status && (
            <div className="mb-3 flex justify-center">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ${
                  status === "勤務中"
                    ? "bg-emerald-500/15 text-emerald-700"
                    : status === "休憩中"
                      ? "bg-amber-500/15 text-amber-700"
                      : "bg-gray-200 text-gray-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "退勤済み" ? "bg-gray-400" : "animate-pulse bg-current"
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

      {/* 未設定時: 自分だけの学習プラン作成への誘導 */}
      {!hasPlan && (
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 py-8 text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100/80 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
        >
          <PlusCircle className="h-8 w-8 shrink-0" />
          <span className="text-lg font-semibold">自分だけの学習プランを作成する</span>
        </Link>
      )}

      {/* 並び替え可能: 設定済みならクイズ＋ニュース＋今日は何の日 / 未設定ならニュース＋今日は何の日 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleCardOrder}
          strategy={verticalListSortingStrategy}
        >
          {visibleCardOrder.map((id) => (
            <SortableCard
              key={id}
              id={id}
              title={cardMap[id].title}
            >
              {cardMap[id].content}
            </SortableCard>
          ))}
        </SortableContext>
      </DndContext>

      {hasPlan && showAppliedPlan && appliedPlanSummary && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800">現在の学習プラン</p>
          <p className="mt-1 text-sm text-emerald-900/90">
            {appliedPlanSummary.slice(0, 120)}
            {appliedPlanSummary.length > 120 ? "…" : ""}
          </p>
        </div>
      )}

      {/* 勤怠・履歴 */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
          <FileText className="h-4 w-4 text-emerald-600" />
          勤怠状況（今日）
        </h2>
        <p className="mb-3 text-xs font-medium text-gray-500">
          {today.date.replace(/-/g, "/")}
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-700">出勤</th>
                <th className="px-4 py-3 font-semibold text-gray-700">退勤</th>
                <th className="px-4 py-3 font-semibold text-gray-700">休憩</th>
                <th className="px-4 py-3 font-semibold text-gray-700">実労働時間</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 tabular-nums font-medium text-gray-900">
                  {today.clockIn ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums font-medium text-gray-900">
                  {today.clockOut ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {today.breakStart ?? "—"} ～ {today.breakEnd ?? "—"}
                </td>
                <td className="px-4 py-3 tabular-nums font-semibold text-gray-900">
                  {actualMinutes != null ? formatDuration(actualMinutes) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="history"
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
          <Calendar className="h-4 w-4 text-emerald-600" />
          打刻履歴（直近1週間）
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-3 font-semibold text-gray-700">日付</th>
                <th className="px-3 py-3 font-semibold text-gray-700">出勤</th>
                <th className="px-3 py-3 font-semibold text-gray-700">退勤</th>
                <th className="px-3 py-3 font-semibold text-gray-700">休憩</th>
                <th className="px-3 py-3 font-semibold text-gray-700">実労働</th>
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
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-700">
                      {formatDisplayDate(date)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-900">
                      {rec?.clockIn ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-900">
                      {rec?.clockOut ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-600">
                      {rec?.breakStart ?? "—"}～{rec?.breakEnd ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-medium text-gray-900">
                      {actual != null ? formatDuration(actual) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
