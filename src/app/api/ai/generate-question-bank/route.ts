/**
 * 問題バンクを生成して QuestionBank に保存する。
 * POST body の count で指定された問題数だけを 1 回の API コールで生成（デフォルト10、最大20）。
 * Gemini (gemini-1.5-flash) を使用。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const LEVEL_GUIDE: Record<string, string> = {
  beginner: "初心者向け：平易な言葉、短い文で。",
  intermediate: "中級者向け：基本的な用語を使って。",
  advanced: "上級者向け：専門用語と背景に触れて。",
  pro: "プロ向け：業界標準用語で簡潔に。",
};
const SKIP_OPTION = "わからない（スキップ）";

type BankQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function buildPrompt(goal: string, level: string, count: number): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは学習用の4択クイズ問題を作成する専門家です。
以下の【テーマ・指針】と【レベル】に沿って、${count}問の4択問題を生成してください。

【テーマ・指針】
${goal.trim() || "ビジネス教養（一般常識・マナー・時事）"}

【レベル】
${levelGuide}

【出力形式】
JSON配列のみを出力してください。説明や余計な文字は含めないこと。
配列の長さは必ず${count}問にしてください。省略禁止。

1問あたりの形式：
{"question":"問題文（1文30字以内）","options":["選択肢A","選択肢B","選択肢C","選択肢D","わからない"],"correctIndex":0,"explanation":"解説（20字以内）"}

- correctIndex は 0〜3 の整数（正解の選択肢の番号。0=A, 1=B, 2=C, 3=D）
- options は5つとし、最後は必ず「わからない」
- 問題文・選択肢・解説は指定テーマとレベルに沿った内容にすること`;
}

function parseResponseJson(text: string): BankQuestion[] {
  const trimmed = text.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, "$1").trim();
  const arr = JSON.parse(trimmed) as Array<{
    question?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
  }>;
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((x) => x?.question && Array.isArray(x.options) && x.options.length >= 4)
    .map((x) => {
      let opts = (x.options ?? []).slice(0, 5);
      if (opts.length === 4) opts = [...opts, SKIP_OPTION];
      else if (opts[4] !== SKIP_OPTION && opts[4] !== "わからない") opts = [...opts.slice(0, 4), SKIP_OPTION];
      return {
        id: "",
        question: String(x.question),
        options: opts,
        correctIndex: Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0)),
        explanation: String(x.explanation ?? ""),
      };
    });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  let goal = "";
  let level = "intermediate";
  let planSummary: string | null = null;
  let count = 10;

  try {
    const body = await request.json().catch(() => ({}));
    goal = typeof body.goal === "string" ? body.goal.trim() : "";
    level =
      typeof body.level === "string" &&
      ["beginner", "intermediate", "advanced", "pro"].includes(body.level)
        ? body.level
        : "intermediate";
    planSummary =
      typeof body.planSummary === "string" ? body.planSummary.trim() || null : null;
    const rawCount = typeof body.count === "number" ? body.count : Number(body.count);
    count = Math.min(20, Math.max(1, Number.isFinite(rawCount) ? rawCount : 10));
  } catch {
    // use defaults
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "APIキーが設定されていません" },
      { status: 500 }
    );
  }

  const effectiveGoal = goal || planSummary || "ビジネス教養";
  const prompt = buildPrompt(effectiveGoal, level, count);
  let allQuestions: BankQuestion[] = [];

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: Math.max(2000, count * 200),
        temperature: 0.7,
      },
    });
    const response = result.response;
    if (!response?.candidates?.length) {
      console.error("[generate-question-bank] Gemini returned no candidates");
      return NextResponse.json(
        { error: "問題の生成に失敗しました。しばらくして再試行してください。" },
        { status: 500 }
      );
    }
    const text = response.text();
    allQuestions = parseResponseJson(text);
    allQuestions = allQuestions.map((q, i) => ({
      ...q,
      id: `bank-${userId}-${i}`,
    }));
  } catch (e) {
    console.error("[generate-question-bank] Gemini API error:", e);
    return NextResponse.json(
      { error: "問題の生成に失敗しました。しばらくして再試行してください。" },
      { status: 500 }
    );
  }

  if (allQuestions.length < count) {
    return NextResponse.json(
      { error: "問題の生成数が不足しています。しばらくして再試行してください。" },
      { status: 500 }
    );
  }

  try {
    await prisma.questionBank.upsert({
      where: { userId },
      create: {
        userId,
        planSummary,
        questions: allQuestions as unknown as object,
      },
      update: {
        planSummary,
        questions: allQuestions as unknown as object,
      },
    });
  } catch (e) {
    console.error("questionBank upsert", e);
    return NextResponse.json(
      { error: "問題バンクの保存に失敗しました。" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    count: allQuestions.length,
  });
}
