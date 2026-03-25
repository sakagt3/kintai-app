"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { getTodaysSpecialDay } from "@/lib/specialDays";

/**
 * ダッシュボード上部に表示する「今日は何の日」エリア
 * 出勤時のモチベーションアップ用
 */
export function TodaysSpecialDay() {
  const [dayKey, setDayKey] = useState(() => {
    const now = new Date();
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const y = jst.getUTCFullYear();
    const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
    const d = String(jst.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const y = jst.getUTCFullYear();
      const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
      const d = String(jst.getUTCDate()).padStart(2, "0");
      const nextKey = `${y}-${m}-${d}`;
      setDayKey((prev) => (prev === nextKey ? prev : nextKey));
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const { name, description } = useMemo(getTodaysSpecialDay, [dayKey]);

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3">
      <div className="flex items-start gap-2">
        <Sparkles
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
          aria-hidden
        />
        <div>
          <p className="text-xs font-semibold text-amber-800">今日は何の日</p>
          <p className="mt-0.5 text-sm font-medium text-amber-900">
            {name} — {description}
          </p>
        </div>
      </div>
    </div>
  );
}
