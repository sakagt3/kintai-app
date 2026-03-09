"use client";

/**
 * 忘却曲線インジケーター:「この単語はあとX日で忘れます」を可視化。
 */
import { useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";

type Item = {
  questionId: string;
  questionShort: string;
  nextReviewAt: string;
  daysUntil: number;
};

export function ForgettingCurveIndicator() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quiz/upcoming")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
        <TrendingDown className="h-3.5 w-3.5" />
        忘却曲線インジケーター
      </h3>
      <p className="mb-2 text-[11px] text-amber-800/80">
        復習予定が近い項目です。この単語はあと〇日で忘れやすくなります。
      </p>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((item) => (
          <li
            key={item.questionId}
            className="flex items-center justify-between gap-2 rounded bg-white/70 px-2 py-1.5 text-xs"
          >
            <span className="truncate text-gray-800">
              {item.questionShort}
              {item.questionShort.length >= 40 ? "…" : ""}
            </span>
            <span
              className={
                item.daysUntil <= 1
                  ? "shrink-0 font-semibold text-red-600"
                  : "shrink-0 font-medium text-amber-700"
              }
            >
              あと{item.daysUntil}日
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
