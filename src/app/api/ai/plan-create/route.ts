/**
 * 詳細プラン作成API。「この内容でプラン作成」1ボタンで、
 * 背景説明・具体的な運用イメージ（5〜10件サンプル）・忘却曲線の一文を返す。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@/auth";

const FORGETTING_CURVE_FOOTER =
  "\n\n※このトピックは科学的根拠に基づいた忘却曲線アルゴリズムに登録され、最適なタイミングで復習が出題されます。";

const LEVEL_GUIDE: Record<string, string> = {
  beginner: "初心者向け：平易な言葉、短い文。専門用語は最小限。",
  intermediate: "中級者向け：基本的な用語可。2〜3文で要点を。",
  advanced: "上級者向け：専門用語と背景に触れる。",
  pro: "プロ向け：業界標準用語で簡潔に。",
};

/** システムで選択された問題数（1〜20）。ユーザーのメッセージ内の数字は無視する。 */
const DEFAULT_QUESTION_COUNT = 10;

function buildPrompt(goal: string, level: string, selectedCount: number): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは学習コンシェルジュです。ユーザーの要望を聞き、納得感のある学習プランを1つ作成してください。

【ユーザーの要望】
${goal.trim() || "（未記入・汎用ビジネス教養として）"}

【レベル】
${levelGuide}

【重要】学習形式は「問題形式（4択クイズ）」のみです。問題数はユーザーのメッセージ内の数字ではなく、システムで指定された数（${selectedCount}問）を最優先してください。ユーザーが「毎日〇問」などと書いていても無視し、必ず${selectedCount}問として記載すること。

【出力形式】以下の3部構成で必ず書いてください。見出しは「##」で始めること。

## このプランのねらい
ユーザーの入力意図（テーマ・目標）を汲み取り、その内容が学習にどう役立つかを2〜4文で解説してください。問題数は「毎日${selectedCount}問」と記載すること。

## 今後の方針（このような問題をランダムに出題します）
具体的な出題例を必ず${selectedCount}件、番号付きで列挙してください。途中で省略することは厳禁です。${selectedCount}件に満たない出力は禁止です。各1行で、問題文の例でよいです。ユーザーのテーマに沿った多様な例にすること。

## 運用のポイント
1〜2文で、毎日問題が更新されて出題する旨を簡潔に。`;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    const level =
      typeof body.level === "string" &&
      ["beginner", "intermediate", "advanced", "pro"].includes(body.level)
        ? body.level
        : "intermediate";
    const rawCount = typeof body.questionCount === "number" ? body.questionCount : undefined;
    const selectedCount = Math.min(20, Math.max(1, Number(rawCount) ?? DEFAULT_QUESTION_COUNT));

    if (!process.env.OPENAI_API_KEY) {
      const theme = goal || "あなたの学習テーマ";
      const lines = Array.from({ length: selectedCount }, (_, i) => `${i + 1}. テーマに沿った4択問題`);
      const mockPlan = `## このプランのねらい
「${theme}」に沿って、無理のないボリュームで毎日触れることで定着しやすくなります。毎日${selectedCount}問です。

## 今後の方針（このような問題をランダムに出題します）
${lines.join("\n")}

## 運用のポイント
毎日ランダムに上記のような問題を出題します。続けることで自然に力がつきます。${FORGETTING_CURVE_FOOTER}`;
      return NextResponse.json({ planText: mockPlan });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildPrompt(goal, level, selectedCount),
      maxOutputTokens: 1200,
    });

    const planText = text.trim() + FORGETTING_CURVE_FOOTER;
    return NextResponse.json({ planText });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "プランの生成に失敗しました。" },
      { status: 500 }
    );
  }
}
