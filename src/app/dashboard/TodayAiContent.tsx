"use client";

/**
 * 保存された学習プロンプトに基づく「今日の1問/1トピック」を表示。
 * ダッシュボードで常に表示し、未設定時は設定を促すメッセージを表示。
 */
import { useEffect, useState } from "react";
import { Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

type TodayContent =
  | { hasContent: false; message?: string }
  | {
      hasContent: true;
      type: "quiz";
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }
  | {
      hasContent: true;
      type: "topic";
      title: string;
      body: string;
    };

export function TodayAiContent() {
  const [content, setContent] = useState<TodayContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/ai/today-content")
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.hasContent && data.type) {
          setContent({
            hasContent: true,
            type: data.type,
            ...(data.type === "quiz"
              ? {
                  question: data.question,
                  options: data.options ?? [],
                  correctIndex: Math.min(3, Math.max(0, Number(data.correctIndex) ?? 0)),
                  explanation: data.explanation ?? "",
                }
              : { title: data.title ?? "", body: data.body ?? "" }),
          });
        } else {
          setContent({
            hasContent: false,
            message: data.message ?? "学習テーマを設定すると、ここに毎日違う問題が表示されます。",
          });
        }
      })
      .catch(() =>
        setContent({
          hasContent: false,
          message: "読み込みに失敗しました。",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-xl border border-violet-200/80 bg-violet-50/30 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
          <Sparkles className="h-4 w-4 text-violet-600" />
          AI生成問題
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          今日の1問を生成中…
        </div>
      </section>
    );
  }

  if (!content) return null;

  if (!content.hasContent) {
    return (
      <section className="rounded-xl border border-violet-200/80 bg-violet-50/30 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
          <Sparkles className="h-4 w-4 text-violet-600" />
          AI生成問題
        </h2>
        <p className="mb-4 text-sm text-gray-600">{content.message}</p>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          設定で学習テーマを決める
        </Link>
      </section>
    );
  }

  if (content.type === "topic") {
    return (
      <section className="rounded-xl border border-violet-200/80 bg-violet-50/30 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
          <Sparkles className="h-4 w-4 text-violet-600" />
          AI生成問題
        </h2>
        <p className="mb-1 text-xs font-medium text-violet-800">今日のトピック</p>
        <h3 className="mb-2 font-medium text-gray-900">{content.title}</h3>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {content.body}
        </p>
      </section>
    );
  }

  const correct = selectedIndex !== null && selectedIndex === content.correctIndex;
  const wrong = selectedIndex !== null && selectedIndex !== content.correctIndex;

  return (
    <section className="rounded-xl border border-violet-200/80 bg-violet-50/30 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-gray-800">
        <Sparkles className="h-4 w-4 text-violet-600" />
        AI生成問題
      </h2>
      <p className="mb-3 text-xs font-medium text-violet-800">今日の1問（あなたのテーマに合わせて生成）</p>

      {answered !== null ? (
        <div className="space-y-3">
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
              correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {correct ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <span className="font-medium">
              {correct ? "正解です！" : "不正解"}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">
            {content.explanation}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 font-medium text-gray-900">{content.question}</p>
          <div className="grid gap-2">
            {content.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedIndex(i);
                  setAnswered(i === content.correctIndex);
                }}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm hover:border-violet-300 hover:bg-violet-50/50"
              >
                <span className="w-4 shrink-0 font-mono text-gray-500">
                  {["A", "B", "C", "D"][i]}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
