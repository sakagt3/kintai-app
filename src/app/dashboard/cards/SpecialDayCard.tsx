"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { getTodaysSpecialDay } from "@/lib/specialDays";

export function SpecialDayCard() {
  const special = useMemo(() => {
    try {
      return getTodaysSpecialDay();
    } catch {
      return null;
    }
  }, []);

  if (!special || (Array.isArray(special) && special.length === 0)) {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <p className="text-sm text-amber-800/80 dark:text-amber-200/80">今日は何の日</p>
        <p className="mt-1 text-sm">—</p>
      </div>
    );
  }
  const name = special?.name ?? "—";
  const description = special?.description ?? "";
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
            今日は何の日
          </p>
          <p className="mt-1 text-sm font-medium text-amber-900 dark:text-amber-100">
            {name} — {description}
          </p>
        </div>
      </div>
    </div>
  );
}
