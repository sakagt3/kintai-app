"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { getTodaysSpecialDay } from "@/lib/specialDays";

/**
 * ダッシュボード上部に表示する「今日は何の日」エリア
 * 出勤時のモチベーションアップ用
 */
export function TodaysSpecialDay() {
  const { name, description } = useMemo(getTodaysSpecialDay, []);

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
