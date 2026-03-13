"use client";

/**
 * 学習プラン・プレビュー表示。「このプランを適用して開始する」でDB保存・メイン画面へ即時反映。
 * プラン本文は親が「この内容でプラン作成」で取得し、previewOverrideText で渡す。
 */
import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

type Level = "beginner" | "intermediate" | "advanced" | "pro";

type QuestionItem = { question: string; options: string[]; correctIndex: number; explanation: string };

type Props = {
  goal: string;
  level: Level;
  onApply?: (planText: string) => Promise<void>;
  appliedPlanSummary?: string;
  /** 親で「この内容でプラン作成」により生成したテキスト */
  previewOverrideText?: string;
  /** プラン作成時に生成した問題リスト（適用時に500問バンクが作られ、ダッシュボードで設定数だけランダムに出題） */
  questionList?: QuestionItem[];
  planLoading?: boolean;
};

export function PlanPreview({
  onApply,
  appliedPlanSummary,
  previewOverrideText,
  questionList = [],
  planLoading,
}: Props) {
  const [applying, setApplying] = useState(false);

  const displayText = previewOverrideText ?? "";

  const handleApply = async () => {
    if (!displayText.trim() || applying || !onApply) return;
    setApplying(true);
    try {
      await onApply(displayText);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-violet-800">
          AIプラン・プレビュー
        </span>
      </div>

      {planLoading && (
        <p className="flex items-center gap-2 text-sm text-violet-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          AIがあなたのためのプランを構築中...
        </p>
      )}

      {!planLoading && displayText && (
        <>
          <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-[13px] leading-relaxed text-gray-800">
            {displayText}
          </pre>
          {questionList.length > 0 && (
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-violet-200/60 bg-white/90 p-3">
              <p className="mb-2 text-xs font-semibold text-violet-800">生成された問題リスト（適用後は500問バンクから毎日設定数だけランダムに出題）</p>
              <ol className="list-inside list-decimal space-y-1 text-[12px] text-gray-700">
                {questionList.slice(0, 30).map((q, i) => (
                  <li key={i}>{q.question}</li>
                ))}
                {questionList.length > 30 && <li className="text-gray-500">…他 {questionList.length - 30} 問</li>}
              </ol>
            </div>
          )}
          {onApply && (
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {applying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              このプランを適用して開始する
            </button>
          )}
        </>
      )}

      {!planLoading && appliedPlanSummary && !displayText && (
        <p className="rounded bg-white/80 p-2 text-xs text-gray-600">
          適用中: {appliedPlanSummary.slice(0, 80)}
          {appliedPlanSummary.length > 80 ? "…" : ""}
        </p>
      )}

      {!planLoading && !displayText && !appliedPlanSummary && (
        <p className="text-xs text-gray-500">
          上の「この内容でプラン作成」を押すと、あなた用のプランが表示されます。
        </p>
      )}
    </div>
  );
}
