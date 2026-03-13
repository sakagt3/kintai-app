/**
 * プラン作成API。プラン本文＋問題リスト（20問）を生成し、
 * 適用時に500問バンクが作られ、ダッシュボードではその中から設定数だけランダムに出題する。
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

const DEFAULT_QUESTION_COUNT = 10;
const QUESTION_LIST_SIZE = 20;

function buildPlanPrompt(goal: string, level: string, selectedCount: number): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは学習コンシェルジュです。ユーザーの要望を聞き、納得感のある学習プランを1つ作成してください。

【ユーザーの要望】
${goal.trim() || "（未記入・汎用ビジネス教養として）"}

【レベル】
${levelGuide}

【重要】学習形式は「問題形式（4択クイズ）」のみ。毎日${selectedCount}問をこのプランからランダムに出題する前提で書くこと。

【出力形式】以下の3部構成。見出しは「##」で始めること。

## このプランのねらい
入力意図を汲み取り、学習にどう役立つかを2〜4文で。毎日${selectedCount}問と記載すること。

## 今後の方針（このような問題をランダムに出題します）
具体的な出題例を${selectedCount}件、番号付きで列挙。各1行。省略禁止。

## 運用のポイント
1〜2文で、毎日ランダムに出題する旨を簡潔に。`;
}

function buildQuestionListPrompt(goal: string, level: string, count: number): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは問題作成の専門家。以下のテーマで${count}問の4択問題をJSON配列で出力すること。省略禁止。

【テーマ】${goal.trim() || "ビジネス教養"}
【レベル】${levelGuide}

【出力】JSON配列のみ。[ のあと${count}個のオブジェクト。
1要素: {"question":"30字以内の問題文","options":["A","B","C","D","わからない"],"correctIndex":0,"explanation":"20字以内の解説"}
correctIndexは0〜3。optionsは5つで最後は「わからない」。`;
}

type QuestionListItem = { question: string; options: string[]; correctIndex: number; explanation: string };

function parseQuestionListJson(text: string): QuestionListItem[] {
  const trimmed = text.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, "$1").trim();
  try {
    const arr = JSON.parse(trimmed) as Array<{ question?: string; options?: string[]; correctIndex?: number; explanation?: string }>;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x?.question && Array.isArray(x.options) && x.options.length >= 4)
      .map((x) => ({
        question: String(x.question),
        options: (x.options ?? []).slice(0, 5),
        correctIndex: Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0)),
        explanation: String(x.explanation ?? ""),
      }));
  } catch {
    return [];
  }
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
「${theme}」に沿って、毎日${selectedCount}問です。

## 今後の方針（このような問題をランダムに出題します）
${lines.join("\n")}

## 運用のポイント
毎日ランダムに問題を出題します。${FORGETTING_CURVE_FOOTER}`;
      const mockList = Array.from({ length: Math.min(QUESTION_LIST_SIZE, 20) }, (_, i) => ({
        question: `サンプル問題 ${i + 1}（テーマ: ${theme}）`,
        options: ["A", "B", "C", "D", "わからない"],
        correctIndex: 0,
        explanation: "適用時に500問バンクが生成されます。",
      }));
      return NextResponse.json({ planText: mockPlan, questionList: mockList });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text: planTextRaw } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildPlanPrompt(goal, level, selectedCount),
      maxOutputTokens: 1200,
    });
    const planText = planTextRaw.trim() + FORGETTING_CURVE_FOOTER;

    const listCount = Math.min(QUESTION_LIST_SIZE, Math.max(10, selectedCount * 2));
    const { text: listRaw } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildQuestionListPrompt(goal, level, listCount),
      maxOutputTokens: Math.max(2000, listCount * 200),
    });
    const questionList = parseQuestionListJson(listRaw);

    return NextResponse.json({ planText, questionList });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "プランの生成に失敗しました。" },
      { status: 500 }
    );
  }
}
