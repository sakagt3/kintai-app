"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { getTodaysAiTerms } from "@/lib/aiTerms";

export function AiTermCard() {
  const terms = useMemo(() => {
    try {
      return getTodaysAiTerms();
    } catch {
      return [];
    }
  }, []);

  if (!terms || terms.length === 0) {
    return (
      <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-800/40 dark:bg-violet-950/20">
        <p className="font-semibold text-violet-900 dark:text-violet-100">今日のAI用語</p>
        <p className="mt-1.5 text-sm">—</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4 dark:border-violet-800/40 dark:bg-violet-950/20">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
        <p className="text-base font-semibold text-violet-900 dark:text-violet-100 sm:text-sm">今日のAI用語（3語）</p>
      </div>
      <ul className="mt-3 space-y-3">
        {terms.map((t, i) => (
          <li key={`${t.term}-${i}`} className="border-b border-violet-200/50 pb-3 last:border-0 last:pb-0">
            <p className="text-base font-medium text-violet-900 dark:text-violet-100 sm:text-sm">{t.term}</p>
            <p className="mt-0.5 text-base leading-relaxed text-violet-800/95 dark:text-violet-200/90 sm:text-sm">
              {t.explanation}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
