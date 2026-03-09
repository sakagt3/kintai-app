/**
 * 学習マスタープラン生成API。
 * ユーザーの要望（自由記述）に基づき「今後どのような問題・トピックを毎日ランダムに生成するか」の指針を1つ返す。
 * 設定画面で「この内容で学習を開始する」時に呼び、UserSettings.appliedPlanSummary に保存する。
 */
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@/auth";

const LEVEL_GUIDE: Record<string, string> = {
  beginner: "初心者向け：平易な言葉で、一文を短く。専門用語は最小限。",
  intermediate: "中級者向け：基本的な専門用語可。2〜3文で要点を。",
  advanced: "上級者向け：専門用語と背景・トレードオフに触れる。",
  pro: "プロ向け：業界標準用語と技術的解説。簡潔で情報密度高く。",
};

function buildPrompt(goal: string, level: string): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは学習コンシェルジュです。ユーザーが「今後毎日、ランダムに問題やトピックを生成してほしい」という前提で、その生成方針（マスタープラン・指針）を1つ書いてください。

【ユーザーの要望】
${goal.trim() || "（未記入・汎用ビジネス教養として）"}

【レベル】
${levelGuide}

【出力ルール】
- 明日の具体的な問題は書かず、「どのようなテーマ・難易度・形式で毎日ランダムに出すか」を3〜5文で指針としてまとめる。
- 見出しや番号は不要。本文のみ。`;
}

const MOCK_MASTER_PLAN = `ユーザーの要望に沿って、毎日1問ずつランダムな形式で出題します。難易度は中級を基準に、時々やさしめ・難しめを混ぜて定着を促します。`;

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        masterPlan: goal ? `「${goal}」に沿って、毎日ランダムに1問ずつ出題します。難易度は${level}に合わせます。` : MOCK_MASTER_PLAN,
      });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildPrompt(goal, level),
      maxOutputTokens: 400,
    });

    return NextResponse.json({ masterPlan: text.trim() });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "マスタープランの生成に失敗しました。" },
      { status: 500 }
    );
  }
}
