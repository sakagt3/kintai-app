"use client";

/**
 * 今日のN問をウィザード形式で表示。1問ずつ回答→正解・解説→次へ。忘却曲線の復習混在・定着度表示。
 */
import { useEffect, useState, useCallback } from "react";
import { Sparkles, Loader2, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type QuizItem = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isReview?: boolean;
};

export function TodayAiContent() {
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [retentionRate, setRetentionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [sending, setSending] = useState(false);
  const [extraBatch, setExtraBatch] = useState(0);
  const [dailyQuizCount, setDailyQuizCount] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const shuffleOptionsClient = useCallback(
    (options: string[], correctIndex: number): { options: string[]; correctIndex: number } => {
      if (options.length < 4) return { options, correctIndex };
      const four = options.slice(0, 4);
      const correctText = four[Math.min(3, Math.max(0, correctIndex))];
      const shuffled = [...four].sort(() => Math.random() - 0.5);
      const newIdx = shuffled.indexOf(correctText);
      const skip = options.length > 4 ? options[4] : "わからない（スキップ）";
      return {
        options: [...shuffled, skip],
        correctIndex: newIdx >= 0 ? newIdx : 0,
      };
    },
    []
  );

  const fetchQuestions = useCallback(
    (
      isMore = false,
      appendAfterIndex = 0,
      isNewSession = false,
      excludeIds: string[] = [],
      count?: number
    ) => {
      setLoading(true);
      const uniqueId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `t${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const params = new URLSearchParams();
      params.set("unique_id", uniqueId);
      params.set("_t", String(Date.now()));
      params.set("t", String(Date.now()));
      params.set("random", String(Math.random()));
      if (typeof count === "number" && count >= 1 && count <= 20) {
        params.set("count", String(count));
      }
      if (isNewSession) params.set("is_new_session", "1");
      if (isMore) {
        params.set("more", "1");
        params.set("batch", String(extraBatch + 1));
        if (excludeIds.length > 0) params.set("exclude_ids", excludeIds.join(","));
      }
      const url = `/api/ai/today-questions?${params.toString()}`;
      fetch(url, {
        headers: { "Cache-Control": "no-store", "Pragma": "no-cache" },
        cache: "no-store",
      })
        .then((res) => res.json().catch(() => ({})))
        .then((data) => {
          const raw = Array.isArray(data.questions) ? data.questions : [];
          const SKIP = "わからない（スキップ）";
          let valid = raw
            .filter((q: unknown) => {
              if (!q || typeof q !== "object") return false;
              const o = q as { question?: unknown; options?: unknown };
              return (
                typeof o.question === "string" &&
                Array.isArray(o.options) &&
                o.options.length >= 4
              );
            })
            .map((q: unknown) => {
              const x = q as {
                id?: string;
                question: string;
                options: string[];
                correctIndex?: number;
                explanation?: string;
                isReview?: boolean;
              };
              let opts: string[] = Array.isArray(x.options) ? [...x.options] : [];
              if (opts.length > 5) opts = opts.slice(0, 5);
              if (opts[opts.length - 1] !== SKIP && opts[opts.length - 1] !== "わからない") {
                opts.push("わからない");
              }
              let correctIdx = Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0));
              const shuffled = shuffleOptionsClient(opts, correctIdx);
              opts = shuffled.options;
              correctIdx = shuffled.correctIndex;
              return {
                id:
                  typeof x.id === "string"
                    ? x.id
                    : `q-${Math.random().toString(36).slice(2, 9)}`,
                question: String(x.question ?? ""),
                options: opts,
                correctIndex: correctIdx,
                explanation: String(x.explanation ?? ""),
                isReview: Boolean(x.isReview),
              };
            });
          valid = [...valid].sort(() => Math.random() - 0.5);
          if (isMore) {
            setQuestions((prev) => [...prev, ...valid]);
            setIndex(appendAfterIndex);
            setExtraBatch((b) => b + 1);
          } else {
            setQuestions(valid);
            setIndex(0);
            setResults([]);
            setExtraBatch(0);
          }
          setRetentionRate(
            typeof data.retentionRate === "number" ? data.retentionRate : null
          );
          setDailyQuizCount(
            typeof data.dailyQuizCount === "number" ? data.dailyQuizCount : null
          );
          setIsComplete(data.is_complete === true);
          setSelectedIndex(null);
          setShowResult(false);
        })
        .catch(() => (!isMore && setQuestions([])))
        .finally(() => setLoading(false));
    },
    [extraBatch, shuffleOptionsClient]
  );

  const startNewSession = useCallback(() => {
    setQuestions([]);
    setIndex(0);
    setResults([]);
    setExtraBatch(0);
    setSelectedIndex(null);
    setShowResult(false);
    fetchQuestions(false, 0, true, [], dailyQuizCount ?? undefined);
  }, [fetchQuestions, dailyQuizCount]);

  // 初回: 常に最新の保存済みデータを取得（キャッシュされた古い問題は使わない）
  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store", headers: { "Cache-Control": "no-store" } })
      .then((r) => r.json())
      .then((data: { settings?: { dailyQuizCount?: number } }) => {
        if (cancelled) return;
        const n = data?.settings?.dailyQuizCount;
        const count =
          typeof n === "number" && n >= 1 && n <= 20 ? n : 10;
        fetchQuestions(false, 0, false, [], count);
      })
      .catch(() => {
        if (!cancelled) fetchQuestions(false, 0, false, [], 10);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchQuestions]);

  const current = questions[index];
  const safeOptions = Array.isArray(current?.options) ? current.options : [];
  const isSkipOption = (idx: number) =>
    current?.options?.length === 5 && idx === 4;
  const skipped =
    selectedIndex !== null && current && isSkipOption(selectedIndex);
  const correct =
    !skipped &&
    selectedIndex !== null &&
    current &&
    selectedIndex === current.correctIndex;

  const saveAttempt = useCallback(
    (q: QuizItem, correctAnswer: boolean) => {
      const snapshot = JSON.stringify({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      });
      setSending(true);
      fetch("/api/quiz/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: q.id,
          correct: correctAnswer,
          questionSnapshot: snapshot,
        }),
      })
        .then((res) => {
          if (!res.ok) toast.error("記録の保存に失敗しました");
        })
        .finally(() => setSending(false));
    },
    []
  );

  const handleAnswer = (choiceIndex: number) => {
    if (!current || selectedIndex !== null) return;
    setSelectedIndex(choiceIndex);
    setShowResult(true);
    if (isSkipOption(choiceIndex)) {
      setResults((prev) => [...prev, false]);
      saveAttempt(current, false);
    } else {
      const correctAnswer = choiceIndex === current.correctIndex;
      setResults((prev) => [...prev, correctAnswer]);
      saveAttempt(current, correctAnswer);
    }
  };

  const handleNext = () => {
    if (index + 1 >= questions.length) return;
    setIndex((i) => i + 1);
    setSelectedIndex(null);
    setShowResult(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          今日の問題を生成中…
        </div>
        <p className="text-xs text-slate-400">
          エビングハウスの忘却曲線に基づき出題中
        </p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-5 text-center dark:border-amber-500 dark:bg-amber-950/40">
          <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
            🎉 100問制覇！新しいプランを作成してください
          </p>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            すべての問題が長期記憶ゾーンに到達しました。次の目標に向けて、新しい学習プランを設定しましょう。
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#1E293B]/40 bg-[#1E293B] px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Sparkles className="h-4 w-4" />
            新しい学習プランを作成する
          </Link>
        </div>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          エビングハウスの忘却曲線に基づき、すべての問題が最長間隔（30日以上）に到達した状態です。
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          学習テーマを設定すると、ここに毎日新しい問題が表示されます。忘却曲線に基づき、復習も自動で混ざります。
        </p>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E293B] px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          設定で学習テーマを決める
        </Link>
      </div>
    );
  }

  if (index >= questions.length) {
    const correctCount = results.filter(Boolean).length;
    const allCorrect =
      questions.length > 0 &&
      results.length === questions.length &&
      results.every(Boolean);

    if (allCorrect) {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-5 text-center dark:border-amber-500 dark:bg-amber-950/40">
            <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
              おめでとうございます！このカスタム学習をクリアしました！
            </p>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {questions.length} 問すべて正解です。
            </p>
          </div>
          <p className="text-center text-xs text-slate-500">
            進捗をリセットして新しい500問サイクルを開始するか、次のステップへ進めます。
          </p>
          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              onClick={startNewSession}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#1E293B]/40 bg-[#1E293B] px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "進捗をリセットして新しいサイクルを開始"
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                fetchQuestions(
                  true,
                  questions.length,
                  false,
                  questions.map((q) => q.id),
                  dailyQuizCount ?? undefined
                )
              }
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "次のステップへ（追加問題を表示）"
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
            エビングハウスの忘却曲線に基づき、最適な復習タイミングを算出しています。
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-center dark:bg-emerald-950/30">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            本日の問題が完了しました
          </p>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            {correctCount} / {questions.length} 問正解
          </p>
        </div>
        {(retentionRate !== null || results.length > 0) && (
          <p className="text-center text-xs text-slate-500">
            記憶定着度（直近）：{retentionRate !== null ? `${retentionRate}%` : "—"}
          </p>
        )}
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() =>
              fetchQuestions(
                true,
                questions.length,
                false,
                questions.map((q) => q.id),
                dailyQuizCount ?? undefined
              )
            }
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#1E293B]/40 bg-white px-4 py-3 text-sm font-medium text-[#1E293B] hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                まだ学習を続けますか？（追加問題を表示）
              </>
            )}
          </button>
          <button
            type="button"
            onClick={startNewSession}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "新しい学習を開始する"
            )}
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          エビングハウスの忘却曲線に基づき、最適な復習タイミングを算出しています。
        </p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="text-sm text-slate-500">
        問題を読み込み直しています…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>
          {dailyQuizCount !== null && (
            <span className="mr-2 font-medium text-[#1E293B] dark:text-slate-300">
              本日の目標: {dailyQuizCount}問
            </span>
          )}
          問 {index + 1} / {questions.length}
          {current.isReview && (
            <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              復習
            </span>
          )}
        </span>
        {retentionRate !== null && (
          <span className="font-medium text-[#1E293B] dark:text-slate-300">
            記憶定着度：{retentionRate}%
          </span>
        )}
      </div>

      {!showResult ? (
        <>
          <p className="font-medium text-[#1E293B] dark:text-slate-200">
            {current?.question ?? ""}
          </p>
          <div className="grid gap-2">
            {safeOptions.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswer(i)}
                disabled={sending}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-[#1E293B]/30 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800"
              >
                <span className="w-5 shrink-0 font-mono text-slate-500">
                  {["A", "B", "C", "D", "E"][i] ?? String(i + 1)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 ${
              skipped
                ? "bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300"
                : correct
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
            }`}
          >
            {skipped ? (
              <span className="font-medium">スキップしました</span>
            ) : correct ? (
              <>
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">正解です！</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">不正解</span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {current?.explanation ?? ""}
          </p>
          {index + 1 < questions.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1E293B]/30 bg-[#1E293B] py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              次の問題へ
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIndex(index + 1);
                setSelectedIndex(null);
                setShowResult(false);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1E293B]/30 bg-[#1E293B] py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              完了を見る
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        エビングハウスの忘却曲線に基づき出題中。最適な復習タイミングを算出しています。
      </p>
    </div>
  );
}
