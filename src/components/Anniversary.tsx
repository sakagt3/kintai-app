"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { getTodaysAnniversary } from "@/lib/anniversary";

function getJstDayKey(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function Anniversary() {
  const [dayKey, setDayKey] = useState(() => getJstDayKey());

  useEffect(() => {
    const timer = setInterval(() => {
      const nextKey = getJstDayKey();
      setDayKey((prev) => (prev === nextKey ? prev : nextKey));
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const entry = useMemo(() => getTodaysAnniversary(), [dayKey]);

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 sm:text-xs">今日は何の日</p>
          <p className="mt-1.5 text-base font-semibold text-amber-900 dark:text-amber-100 sm:text-sm">{entry.name}</p>
          <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-amber-900/90 dark:text-amber-100/90 sm:text-sm">
            {entry.detail}
          </p>
          <p className="mt-3 text-xs text-amber-700/80 dark:text-amber-300/80">参照元：{entry.source}</p>
        </div>
      </div>
    </div>
  );
}
