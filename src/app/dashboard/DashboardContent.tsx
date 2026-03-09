"use client";

/**
 * ダッシュボードメイン: 勤怠取得・打刻パネル・インテリジェントバナー・直近7日履歴を表示する。
 * 設定（今日は何の日・AIニュースのON/OFF・表示モード）はAPIから取得し、バナーに反映する。
 */
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PunchPanel } from "./PunchPanel";
import { IntelligentBanner } from "./IntelligentBanner";
import type { BannerSettings } from "./IntelligentBanner";
import { FileText, Calendar } from "lucide-react";

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
  displayMode: "standard",
};

export function DashboardContent() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerSettings, setBannerSettings] =
    useState<BannerSettings>(DEFAULT_BANNER_SETTINGS);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.settings) {
          setBannerSettings({
            showSpecialDay: json.settings.showSpecialDay ?? true,
            showAiNews: json.settings.showAiNews ?? true,
            displayMode: json.settings.displayMode ?? "standard",
          });
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

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1e3a5f] border-t-transparent" />
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

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <IntelligentBanner settings={bannerSettings} />
      {status && (
        <div className="flex items-center justify-center">
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
                status === "退勤済み"
                  ? "bg-gray-400"
                  : "animate-pulse bg-current"
              }`}
              aria-hidden
            />
            {status}
          </span>
        </div>
      )}

      <PunchPanel onSuccess={fetchAttendance} />

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
          <FileText className="h-4 w-4 text-[#1e3a5f]" />
          勤怠状況（今日）
        </h2>
        <p className="mb-4 text-xs font-medium text-gray-500">
          {today.date.replace(/-/g, "/")}
        </p>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 font-semibold text-gray-700">出勤</th>
                <th className="px-4 py-3 font-semibold text-gray-700">退勤</th>
                <th className="px-4 py-3 font-semibold text-gray-700">休憩</th>
                <th className="px-4 py-3 font-semibold text-gray-700">
                  実労働時間
                </th>
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
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
          <Calendar className="h-4 w-4 text-[#1e3a5f]" />
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
                <th className="px-3 py-3 font-semibold text-gray-700">
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
