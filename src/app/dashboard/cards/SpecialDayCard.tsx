"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { getTodaysAnniversary } from "@/lib/anniversary";

export function SpecialDayCard() {
  const special = useMemo(() => {
    try {
      return getTodaysAnniversary();
    } catch {
      return null;
    }
  }, []);

  if (!special) {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">今日は何の日</p>
        <p className="mt-1 text-sm">—</p>
        <p className="mt-3 text-xs text-amber-700/80 dark:text-amber-300/80">
          参照元：日本記念日協会 / Wikipedia等
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 sm:text-xs">
            今日は何の日
          </p>
          <p className="mt-1.5 text-base font-semibold text-amber-900 dark:text-amber-100 sm:text-sm">
            {special.name}
          </p>
          <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-amber-900/90 dark:text-amber-100/90 sm:text-sm">
            {special.detail}
          </p>
          <p className="mt-3 text-xs text-amber-700/80 dark:text-amber-300/80">
            参照元：{special.source}
          </p>
        </div>
      </div>
    </div>
  );
}
