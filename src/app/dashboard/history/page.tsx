"use client";

import { useState, useEffect, useCallback } from "react";
import { History, ChevronLeft, ChevronRight } from "lucide-react";

const REGULAR_END_MINUTES = 17 * 60 + 30;

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

function calcActualWorkMinutes(
  clockIn: string | null,
  clockOut: string | null,
  breakStart: string | null,
  breakEnd: string | null
): number | null {
  const inM = parseTimeToMinutes(clockIn);
  const outM = parseTimeToMinutes(clockOut);
  if (inM == null || outM == null) return null;
  const gross = outM - inM;
  const breakS = parseTimeToMinutes(breakStart);
  const breakE = parseTimeToMinutes(breakEnd);
  const breakM = breakS != null && breakE != null && breakE > breakS ? breakE - breakS : 0;
  const actual = gross - breakM;
  return actual > 0 ? actual : null;
}

function calcOvertimeMinutes(clockOut: string | null): number {
  const out = parseTimeToMinutes(clockOut);
  if (out == null) return 0;
  if (out <= REGULAR_END_MINUTES) return 0;
  return out - REGULAR_END_MINUTES;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return "—";
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const w = d.getUTCDay();
  return `${month}/${day}（${weekdays[w] ?? "—"}）`;
}

type RecordEntry = {
  clockIn: string | null;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
};

export default function HistoryPage() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const [year, setYear] = useState(() => jst.getUTCFullYear());
  const [month, setMonth] = useState(() => jst.getUTCMonth() + 1);
  const [data, setData] = useState<{ monthDates: string[]; byDate: Record<string, RecordEntry> } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRange = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/range?year=${year}&month=${month}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        return;
      }
      setData({ monthDates: json.monthDates ?? [], byDate: json.byDate ?? {} });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchRange();
  }, [fetchRange]);

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };

  const monthLabel = `${year}年${month}月`;
  const dates = data?.monthDates ?? [];
  const byDate = data?.byDate ?? {};

  const rows = dates
    .map((date) => {
      const rec = byDate[date];
      const actual = rec
        ? calcActualWorkMinutes(rec.clockIn, rec.clockOut, rec.breakStart, rec.breakEnd)
        : null;
      const overtime = rec ? calcOvertimeMinutes(rec.clockOut) : 0;
      return { date, rec, actual, overtime };
    })
    .filter((r) => r.rec?.clockIn ?? r.rec?.clockOut);

  const totalActual = rows.reduce((sum, r) => sum + (r.actual ?? 0), 0);
  const totalOvertime = rows.reduce((sum, r) => sum + r.overtime, 0);
  const avgActual = rows.length > 0 ? Math.round(totalActual / rows.length) : 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-[#1E293B] dark:text-slate-400" />
        <h1 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">
          打刻履歴
        </h1>
      </div>

      {/* 年月選択 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-l-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="前月"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[120px] px-4 py-2 text-center text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-200">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-r-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="翌月"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {Array.from({ length: 12 }, (_, i) => now.getFullYear() - 10 + i).map((y) => (
            <option key={y} value={y}>{y}年</option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{m}月</option>
          ))}
        </select>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">打刻日数</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{rows.length}日</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">平均勤務時間</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatDuration(avgActual)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">合計残業（定時17:30〜）</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-amber-700 dark:text-amber-400">{formatDuration(totalOvertime)}</p>
        </div>
      </div>

      {/* 一覧テーブル */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(30,41,59,0.08)] dark:border-slate-700 dark:bg-slate-900/50">
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-[#1E293B] dark:text-slate-200">{monthLabel} の打刻一覧</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1E293B] border-t-transparent" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">この期間の打刻はありません</p>
          ) : (
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800/50">
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">日付</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">出勤</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">退勤</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">休憩</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">実労働</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">残業</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ date, rec, actual, overtime }) => (
                  <tr key={date} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{formatDisplayDate(date)}</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-900 dark:text-slate-200">{rec?.clockIn ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-900 dark:text-slate-200">{rec?.clockOut ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums text-slate-600 dark:text-slate-400">{rec?.breakStart ?? "—"} ～ {rec?.breakEnd ?? "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium text-slate-900 dark:text-slate-200">{actual != null ? formatDuration(actual) : "—"}</td>
                    <td className="px-4 py-2.5 tabular-nums font-medium text-amber-700 dark:text-amber-400">{overtime > 0 ? formatDuration(overtime) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
