/**
 * プラン適用時に500問を一括生成して QuestionBank に保存する。
 * 出題はこのプールからランダム抽出するため、毎回同じ問題になることを防ぐ。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const BANK_SIZE = 500;
const BATCH_SIZE = 50;
const LEVEL_GUIDE: Record<string, string> = {
  beginner: "初心者向け：平易な言葉、短い文。",
  intermediate: "中級者向け：基本的な用語可。",
  advanced: "上級者向け：専門用語と背景に触れる。",
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

function buildBatchPrompt(
  goal: string,
  level: string,
  batchIndex: number,
  totalBatches: number,
  count: number
): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは500問以上の独自問題データベースを脳内に持つ専門講師です。
このリクエストでは、その中から「${count}問」を選んでJSON配列で出力してください。既に別バッチで出した問題と重複しない、独自の内容にすること。

【指針・テーマ】
${goal.trim() || "ビジネス教養（一般常識・マナー・時事）"}

【レベル】
${levelGuide}

【出力】必ず${count}問、JSON配列のみ。省略禁止。配列の長さが${count}でなければ失敗。
1要素: {"question":"短い問題文（1文30字以内）","options":["A","B","C","D","わからない"],"correctIndex":0,"explanation":"短い解説（20字以内）"}
correctIndexは0〜3。optionsは5つで最後は「わからない」。バッチ${batchIndex + 1}/${totalBatches}。`;
}

function parseBatchJson(text: string): BankQuestion[] {
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
    .map((x, i) => {
      let opts = (x.options ?? []).slice(0, 5);
      if (opts.length === 4) opts = [...opts, SKIP_OPTION];
      else if (opts[4] !== SKIP_OPTION && opts[4] !== "わからない") opts = [...opts.slice(0, 4), SKIP_OPTION];
      return {
        id: "", // 保存直前に付与
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
  } catch {
    // use defaults
  }

  const effectiveGoal = goal || planSummary || "ビジネス教養";
  const totalBatches = Math.ceil(BANK_SIZE / BATCH_SIZE); // 10
  const allQuestions: BankQuestion[] = [];

  if (!process.env.OPENAI_API_KEY) {
    // モック: 同じテンプレートを500問分複製（テスト用）
    const templates: BankQuestion[] = [
      {
        id: "",
        question: "RAGの「R」は何の略ですか？",
        options: ["Retrieval", "Real-time", "Random", "Resource", SKIP_OPTION],
        correctIndex: 0,
        explanation: "RAGは Retrieval-Augmented Generation の略です。",
      },
      {
        id: "",
        question: "LLMで「Hallucination」とは？",
        options: ["幻覚的な出力", "高速応答", "多言語対応", "暗号化", SKIP_OPTION],
        correctIndex: 0,
        explanation: "事実に基づかない内容をそれらしく生成する現象です。",
      },
      {
        id: "",
        question: "機械学習の「教師あり学習」とは？",
        options: ["正解付きデータで学習する方式", "ラベルなしデータのみで学習", "強化学習の別名", "推論のみ行う方式", SKIP_OPTION],
        correctIndex: 0,
        explanation: "正解（ラベル）付きデータでモデルを学習させる方式です。",
      },
      {
        id: "",
        question: "APIの「REST」の特徴として適切なのは？",
        options: ["リソースをURLで表現しHTTPメソッドで操作", "必ずXMLで通信する", "状態をサーバーが保持する", "TCPのみで動作する", SKIP_OPTION],
        correctIndex: 0,
        explanation: "RESTはリソースをURLで表現し、GET/POST等で操作するアーキテクチャです。",
      },
      {
        id: "",
        question: "「マイクロサービス」の利点は？",
        options: ["サービスごとに独立してスケール・デプロイできる", "必ず1台のサーバーで動作する", "モノリスより常に遅い", "言語を1つに統一しなければならない", SKIP_OPTION],
        correctIndex: 0,
        explanation: "サービスを小さく分離することで、独立したスケール・デプロイが可能になります。",
      },
    ];
    for (let i = 0; i < BANK_SIZE; i++) {
      const t = templates[i % templates.length];
      allQuestions.push({
        ...t,
        id: `bank-${userId}-${i}`,
      });
    }
  } else {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    for (let b = 0; b < totalBatches; b++) {
      const count = b === totalBatches - 1 ? BANK_SIZE - (totalBatches - 1) * BATCH_SIZE : BATCH_SIZE;
      const prompt = buildBatchPrompt(effectiveGoal, level, b, totalBatches, count);
      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
          maxOutputTokens: Math.max(4000, count * 350),
        });
        const batch = parseBatchJson(text);
        batch.forEach((q, i) => {
          allQuestions.push({
            ...q,
            id: `bank-${userId}-${b * BATCH_SIZE + i}`,
          });
        });
      } catch (e) {
        console.error("generate-question-bank batch", b, e);
        // 失敗したバッチ分はスキップして続行
      }
    }
  }

  if (allQuestions.length < 100) {
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
