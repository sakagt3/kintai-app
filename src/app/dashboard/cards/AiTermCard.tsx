"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { getTodaysAiTerm } from "@/lib/aiTerms";

export function AiTermCard() {
  const term = useMemo(() => {
    try {
      return getTodaysAiTerm();
    } catch {
      return null;
    }
  }, []);

  if (!term || (Array.isArray(term) && term.length === 0)) {
    return (
      <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-800/40 dark:bg-violet-950/20">
        <p className="font-semibold text-violet-900 dark:text-violet-100">今日のAI用語</p>
        <p className="mt-1.5 text-sm">—</p>
      </div>
    );
  }
  const termStr = term?.term ?? "—";
  const explanation = term?.explanation ?? "";
  return (
    <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-800/40 dark:bg-violet-950/20">
      <div className="flex items-start gap-3">
        <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-violet-900 dark:text-violet-100">
            {termStr}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-violet-800/95 dark:text-violet-200/90">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
