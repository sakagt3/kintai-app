"use client";

/**
 * 忘却曲線ベースの一問一答クイズ。今日の出題を取得し、1問ずつ表示・回答送信・解説表示。
 */
import { useEffect, useState, useCallback } from "react";
import { HelpCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type QuizItem = {
  id: string;
  type: string;
  question: string;
  options: [string, string, string, string];
  explanation: string;
};

export function QuizPanel() {
  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [result, setResult] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/quiz/today");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setQuestions([]);
        return;
      }
      setQuestions(json.questions ?? []);
      setIndex(0);
      setResult(null);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const current = questions[index];

  const handleAnswer = async (selectedIndex: number) => {
    if (!current || answering) return;
    setAnswering(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          selectedIndex,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "送信に失敗しました。");
        setAnswering(false);
        return;
      }
      setResult({
        correct: json.correct,
        explanation: json.explanation ?? current.explanation,
      });
      if (json.correct) toast.success("正解です！");
      else toast.error("不正解");
    } catch {
      toast.error("通信エラー");
      setAnswering(false);
    } finally {
      setAnswering(false);
    }
  };

  const goNext = () => {
    setResult(null);
    if (index + 1 < questions.length) setIndex(index + 1);
    else setQuestions([]);
  };

  if (loading) return null;
  if (questions.length === 0) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
        <HelpCircle className="h-4 w-4 text-[#1e3a5f]" />
        今日覚えるべき単語・用語クイズ
      </h2>
      <p className="mb-4 text-xs text-gray-500">
        {index + 1} / {questions.length} 問目（忘却曲線に基づき復習が必要な問題を優先）
      </p>

      {result ? (
        <div className="space-y-4">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
              result.correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {result.correct ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="font-medium">
              {result.correct ? "正解です！" : "不正解"}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">
            {result.explanation}
          </p>
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
          >
            {index + 1 < questions.length ? "次の問題" : "本日のクイズを終了"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-medium text-gray-900">{current.question}</p>
          <div className="grid gap-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswer(i)}
                disabled={answering}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 disabled:opacity-50"
              >
                {answering ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : (
                  <span className="w-4 shrink-0 font-mono text-gray-500">
                    {["A", "B", "C", "D"][i]}
                  </span>
                )}
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
