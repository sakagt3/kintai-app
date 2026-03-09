"use client";

/**
 * 学習目標・レベルに応じてAIが「明日のクイズ3問」と「ニュース解説サンプル」をストリーミング表示。
 * タイピング風アニメーションと「AIがあなたのためのプランを構築中...」演出。
 */
import { useState, useCallback, useRef } from "react";
import { Sparkles, Loader2 } from "lucide-react";

type Level = "beginner" | "intermediate" | "advanced" | "pro";

type Props = {
  goal: string;
  level: Level;
  onStart?: () => void;
  onDone?: () => void;
};

export function PlanPreview({ goal, level, onStart, onDone }: Props) {
  const [streaming, setStreaming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const runPreview = useCallback(async () => {
    if (streaming) return;
    setError("");
    setText("");
    setStreaming(true);
    onStart?.();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/plan-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal || "ビジネス教養", level }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "生成に失敗しました");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setText(full);
      }
      onDone?.();
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message ?? "エラーが発生しました");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [goal, level, streaming, onStart, onDone]);

  return (
    <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-violet-800">
          AIプラン・プレビュー
        </span>
        <button
          type="button"
          onClick={runPreview}
          disabled={streaming}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {streaming ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              プレビューを生成
            </>
          )}
        </button>
      </div>

      {streaming && !text && (
        <p className="flex items-center gap-2 text-sm text-violet-700">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-violet-500" />
          AIがあなたのためのプランを構築中...
        </p>
      )}

      {text && (
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-[13px] leading-relaxed text-gray-800">
          {text}
        </pre>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
