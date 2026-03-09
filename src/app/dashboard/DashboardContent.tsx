"use client"

import { useEffect, useState, useCallback } from "react"
import { PunchPanel } from "./PunchPanel"
import { Clock, FileText, Calendar } from "lucide-react"

type AttendanceData = {
  today: { date: string; clockIn: string | null; clockOut: string | null }
  last7Dates: string[]
  historyByDate: Record<string, { clockIn: string | null; clockOut: string | null }>
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z")
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
  const month = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const weekday = weekdays[d.getUTCDay()]
  return `${month}/${day}（${weekday}）`
}

function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr || timeStr === "—") return null
  const [h, m] = timeStr.split(":").map(Number)
  if (Number.isNaN(h)) return null
  return h * 60 + (Number.isNaN(m) ? 0 : m)
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}

function calcWorkMinutes(clockIn: string | null, clockOut: string | null): number | null {
  const inM = parseTimeToMinutes(clockIn)
  const outM = parseTimeToMinutes(clockOut)
  if (inM == null || outM == null) return null
  const diff = outM - inM
  return diff > 0 ? diff : null
}

export function DashboardContent() {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance")
      if (!res.ok) throw new Error("取得に失敗しました")
      const json = await res.json()
      setData(json)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-600 border-t-transparent" />
      </div>
    )
  }

  const today = data?.today ?? { date: "", clockIn: null, clockOut: null }
  const last7Dates = data?.last7Dates ?? []
  const historyByDate = data?.historyByDate ?? {}
  const workMinutes = calcWorkMinutes(today.clockIn, today.clockOut)
  const status = today.clockIn
    ? today.clockOut
      ? "退勤済み"
      : "勤務中"
    : null

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PunchPanel onSuccess={fetchAttendance} />

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
          <FileText className="h-4 w-4 text-[#1e3a5f]" />
          勤怠状況（今日）
        </h2>
        <p className="mb-3 text-xs text-gray-500">{today.date.replace(/-/g, "/")}</p>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 font-semibold text-gray-700">出勤</th>
                <th className="px-4 py-2.5 font-semibold text-gray-700">退勤</th>
                <th className="px-4 py-2.5 font-semibold text-gray-700">勤務時間</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-3 tabular-nums text-gray-900">{today.clockIn ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums text-gray-900">{today.clockOut ?? "—"}</td>
                <td className="px-4 py-3 tabular-nums font-medium text-gray-900">
                  {workMinutes != null ? formatDuration(workMinutes) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {status && (
          <p className="mt-3 text-xs font-medium text-gray-600">
            ステータス: <span className={status === "勤務中" ? "text-green-600" : "text-gray-500"}>{status}</span>
          </p>
        )}
      </section>

      <section id="history" className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Calendar className="h-4 w-4 text-[#1e3a5f]" />
          打刻履歴（直近1週間）
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 font-semibold text-gray-700">日付</th>
                <th className="px-3 py-2 font-semibold text-gray-700">出勤</th>
                <th className="px-3 py-2 font-semibold text-gray-700">退勤</th>
                <th className="px-3 py-2 font-semibold text-gray-700">勤務時間</th>
              </tr>
            </thead>
            <tbody>
              {last7Dates.map((date) => {
                const rec = historyByDate[date]
                const workM = calcWorkMinutes(rec?.clockIn ?? null, rec?.clockOut ?? null)
                return (
                  <tr key={date} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2.5 font-medium text-gray-700">{formatDisplayDate(date)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-900">{rec?.clockIn ?? "—"}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-900">{rec?.clockOut ?? "—"}</td>
                    <td className="px-3 py-2.5 tabular-nums font-medium text-gray-900">
                      {workM != null ? formatDuration(workM) : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
