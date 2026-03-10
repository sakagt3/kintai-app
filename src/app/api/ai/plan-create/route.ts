/**
 * 詳細プラン作成API。「この内容でプラン作成」1ボタンで、
 * 背景説明・具体的な運用イメージ（5〜10件サンプル）・忘却曲線の一文を返す。
 */
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

/** 自由記述から「〇問」を抽出。5〜10の範囲で返す。 */
function parseSampleCount(goal: string): number {
  const match = goal.match(/(\d+)\s*問/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (Number.isFinite(n) && n >= 1) return Math.min(10, Math.max(5, n));
  }
  return 5;
}

function buildPrompt(goal: string, level: string, sampleCount: number): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは学習コンシェルジュです。ユーザーの要望を聞き、納得感のある学習プランを1つ作成してください。

【ユーザーの要望】
${goal.trim() || "（未記入・汎用ビジネス教養として）"}

【レベル】
${levelGuide}

【重要】学習形式は「問題形式（4択クイズ）」のみです。ユーザーが問題数・ボリューム（例「毎日5問」「頻出500語」）を書いていない場合は、「このような形でどうですか？」と提案を1文で含めてください。例：「TOEIC800点を目指す頻出単語500語を抽出し、毎日5問ずつ出題します。」

【出力形式】以下の3部構成で必ず書いてください。見出しは「##」で始めること。

## このプランのねらい
ユーザーの入力意図（出題数・テーマ・目標）を汲み取り、その内容・ボリュームが学習にどう役立つかを2〜4文で解説してください。指示が曖昧な場合は上記のとおり具体的な提案（例：500語抽出・毎日5問）を入れること。

## 今後の方針（このような問題をランダムに出題します）
問題数・トピックを読み取り、具体的な出題例を${sampleCount}件、番号付きで列挙してください。各1行で、問題文の例でよいです。ユーザーのテーマに沿った多様な例にすること。

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

    const sampleCount = parseSampleCount(goal);

    if (!process.env.OPENAI_API_KEY) {
      const theme = goal || "あなたの学習テーマ";
      const mockPlan = `## このプランのねらい
「${theme}」に沿って、無理のないボリュームで毎日触れることで定着しやすくなります。${sampleCount}問程度なら隙間時間で続けられます。

## 今後の方針（このような問題をランダムに出題します）
1. テーマに沿った4択問題
2. 用語の意味確認
3. 実務での使い方
4. 要点の整理
5. 応用問題
${sampleCount > 5 ? "6. 類義語の選択\n7. 文脈に合う語句\n8. 要点の要約\n9. 実例の読み取り\n10. 手順の確認\n" : ""}

## 運用のポイント
毎日ランダムに上記のような問題を出題します。続けることで自然に力がつきます。${FORGETTING_CURVE_FOOTER}`;
      return NextResponse.json({ planText: mockPlan });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildPrompt(goal, level, sampleCount),
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
