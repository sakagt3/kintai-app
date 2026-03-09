"use client";

/**
 * 1分で終わるクイック診断: 3問に答えるとAIが「君は〇〇だね。このプランはどう？」と提案。
 */
import { useState, useCallback } from "react";
import { Zap, Loader2 } from "lucide-react";
import { getQuestionsByIds } from "@/lib/quizBank";

const DIAGNOSIS_QUESTION_IDS = ["it_1", "it_2", "vocab_1"];

export function QuickDiagnosis() {
  const [step, setStep] = useState<"idle" | "quiz" | "result">("idle");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ level: string; message: string } | null>(null);

  const questions = getQuestionsByIds(DIAGNOSIS_QUESTION_IDS);
  const current = questions[index];

  const handleAnswer = useCallback(
    (selectedIndex: number) => {
      if (!current) return;
      const next = [...answers, { questionId: current.id, selectedIndex }];
      setAnswers(next);
      if (next.length >= 3) {
        setLoading(true);
        fetch("/api/ai/quick-diagnosis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: next }),
        })
          .then((res) => res.json())
          .then((data) => {
            setResult({
              level: data.level ?? "中級者",
              message: data.message ?? "このプランはどう？",
            });
            setStep("result");
          })
          .catch(() => setStep("quiz"))
          .finally(() => setLoading(false));
      } else {
        setIndex(index + 1);
      }
    },
    [current, index, answers]
  );

  if (questions.length === 0) return null;

  return (
    <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-sky-900">
        <Zap className="h-4 w-4" />
        1分で終わるクイック診断
      </div>

      {step === "idle" && (
        <p className="mb-3 text-xs text-sky-800/90">
          3問に答えると、AIがあなたのレベルを推定して「このプランはどう？」と提案します。
        </p>
      )}

      {step === "idle" && (
        <button
          type="button"
          onClick={() => setStep("quiz")}
          className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700"
        >
          診断を始める
        </button>
      )}

      {(step === "quiz" || loading) && current && !result && (
        <div className="space-y-3">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-sky-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              AIがレベルを判定しています...
            </p>
          ) : (
            <>
              <p className="text-xs text-sky-800">
                問 {index + 1} / 3: {current.question}
              </p>
              <div className="flex flex-wrap gap-2">
                {current.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAnswer(i)}
                    className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs hover:bg-sky-100"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {step === "result" && result && (
        <div className="rounded-lg bg-white/80 p-3 text-sm text-sky-900">
          <p className="font-medium">{result.message}</p>
          <button
            type="button"
            onClick={() => {
              setStep("idle");
              setIndex(0);
              setAnswers([]);
              setResult(null);
            }}
            className="mt-2 text-xs text-sky-600 underline"
          >
            もう一度診断する
          </button>
        </div>
      )}
    </div>
  );
}
