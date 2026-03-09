"use client";

import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

type LeaveItem = { id: string; date: string; type: string; createdAt: string };

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}/${m}/${day}`;
}

export default function LeavePage() {
  const [date, setDate] = useState("");
  const [type, setType] = useState<"有給" | "欠勤">("有給");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<LeaveItem[]>([]);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/leave");
      if (!res.ok) return;
      const json = await res.json();
      setList(json.list ?? []);
    } catch {
      setList([]);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("日付を選択してください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "申請に失敗しました。");
        return;
      }
      toast.success("休暇申請を送信しました。");
      setDate("");
      fetchList();
    } catch {
      toast.error("申請に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-5 flex items-center gap-2 text-base font-semibold tracking-tight text-gray-800">
          <CalendarPlus className="h-5 w-5 text-[#1e3a5f]" />
          休暇申請
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="date"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              日付
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              種別
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "有給" | "欠勤")}
              className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-[#1e3a5f]"
            >
              <option value="有給">有給</option>
              <option value="欠勤">欠勤</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-xs rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2d4a6f] disabled:opacity-50"
          >
            {loading ? "送信中..." : "申請する"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold tracking-tight text-gray-800">
          申請一覧
        </h2>
        {list.length === 0 ? (
          <p className="text-sm text-gray-500">まだ申請がありません。</p>
        ) : (
          <ul className="space-y-2">
            {list.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 py-2.5 px-3 text-sm"
              >
                <span className="font-medium text-gray-800">
                  {formatDate(item.date)}
                </span>
                <span
                  className={
                    item.type === "有給" ? "text-emerald-600" : "text-gray-600"
                  }
                >
                  {item.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
