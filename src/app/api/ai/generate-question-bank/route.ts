/**
 * 問題バンクを生成して QuestionBank に保存する。
 * 常に 100 問を 20 問 × 5 バッチで生成する（Gemini, gemini-1.5-flash-latest）。
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
const BATCH_SIZE = 20;
const TOTAL_COUNT = 100;

type BankQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function buildPrompt(goal: string, level: string, count: number, batchIndex: number, totalBatches: number): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは学習用の4択クイズ問題を作成する専門家です。
以下の【テーマ・指針】と【レベル】に沿って、${count}問の4択問題を生成してください。

【テーマ・指針】
${goal.trim() || "ビジネス教養（一般常識・マナー・時事）"}

【レベル】
${levelGuide}

【出力形式】
JSON配列のみを出力してください。説明や余計な文字は含めないこと。
配列の長さは必ず${count}問にしてください。省略禁止。バッチ ${batchIndex + 1}/${totalBatches} として、他バッチと内容が重複しないようにしてください。

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
  // count は常に 100 に固定（body.count は将来の拡張用だが現在は無視）
  let count = TOTAL_COUNT;

  try {
    const body = await request.json().catch(() => ({}));
    goal = typeof body.goal === "string" ? body.goal.trim() : "";
    level =
      typeof body.level === "string" &&
      ["beginner", "intermediate", "advanced", "pro"].includes(body.level)
        ? body.level
        : "intermediate";
    // body.count は現時点では無視し、常に TOTAL_COUNT を採用する
  } catch {
    // use defaults
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "APIキーが設定されていません" },
      { status: 500 }
    );
  }

  const effectiveGoal = goal || "ビジネス教養";
  const totalBatches = Math.ceil(count / BATCH_SIZE);
  let allQuestions: BankQuestion[] = [];

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    for (let b = 0; b < totalBatches && allQuestions.length < count; b++) {
      const remaining = count - allQuestions.length;
      const batchCount = Math.min(BATCH_SIZE, remaining);
      const prompt = buildPrompt(effectiveGoal, level, batchCount, b, totalBatches);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: Math.max(2000, batchCount * 200),
          temperature: 0.7,
        },
      });
      const response = result.response;
      if (!response?.candidates?.length) {
        console.error("[generate-question-bank] Gemini returned no candidates for batch", b);
        continue;
      }
      const text = response.text();
      const batchQuestions = parseResponseJson(text);
      allQuestions.push(...batchQuestions);
    }
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

  allQuestions = allQuestions.slice(0, count);

  // @@unique([userId, question]) 用に問題文で重複除去
  function normalizeQuestionText(text: string): string {
    return String(text ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }
  const seenKeys = new Set<string>();
  allQuestions = allQuestions.filter((q) => {
    const key = normalizeQuestionText(q.question);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  try {
    await prisma.$transaction([
      prisma.questionBank.deleteMany({ where: { userId } }),
      prisma.questionBank.createMany({
        data: allQuestions.map((q) => ({
          userId,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      }),
    ]);
  } catch (e) {
    console.error("questionBank deleteMany/createMany", e);
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
