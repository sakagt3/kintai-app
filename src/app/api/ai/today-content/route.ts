/**
 * 今日の1問/1トピックを、保存された学習プロンプト（UserSettings）を元にLLMでその場生成。
 * ダッシュボード読み込み時に呼び、AI生成問題エリアに表示する。難易度は learningLevel（クイック診断で更新）に準拠。
 */
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const LEVEL_GUIDE: Record<string, string> = {
  beginner: "初心者向け：平易な言葉、短い文、専門用語は最小限。",
  intermediate: "中級者向け：基本的な用語可。2〜3文で要点を。",
  advanced: "上級者向け：専門用語と背景に触れる。",
  pro: "プロ向け：業界標準用語で簡潔に。",
};

function buildPrompt(goal: string, planSummary: string, level: string): string {
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;
  return `あなたは毎日1問をランダムに生成する学習アシスタントです。以下の「マスタープラン」に基づき、今日の1問だけを生成してください。

【マスタープラン（指針）】
${planSummary || "（未設定）"}

【ユーザーの要望】
${goal || "（未設定）"}

【レベル】
${levelGuide}

【出力形式】以下を厳守し、JSONのみを1つ出力してください。説明や前後の文章は不要。
{"type":"quiz","question":"（4択の問題文。例: RAGのRは何の略？）","options":["A: Retrieval","B: Real-time","C: Random","D: Resource"],"correctIndex":0,"explanation":"（正解の簡潔な解説）"}

または トピック1つの場合:
{"type":"topic","title":"（短い見出し）","body":"（2〜4文の解説）"}

type は "quiz" か "topic" のどちらか。quiz のときは correctIndex は 0〜3 の整数。options は4要素の配列。`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  const goal = settings?.customLearningGoal?.trim() ?? "";
  const planSummary = settings?.appliedPlanSummary?.trim() ?? "";
  const level =
    settings?.learningLevel && ["beginner", "intermediate", "advanced", "pro"].includes(settings.learningLevel)
      ? settings.learningLevel
      : "intermediate";

  if (!goal && !planSummary) {
    return NextResponse.json({
      hasContent: false,
      message: "学習テーマを設定すると、ここに毎日違う問題が表示されます。",
    });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      const mockQuiz = {
        type: "quiz" as const,
        question: "「RAG」の「R」は何の略ですか？",
        options: ["Retrieval", "Real-time", "Random", "Resource"],
        correctIndex: 0,
        explanation: "RAGは Retrieval-Augmented Generation の略で、検索で得た情報をLLMに渡して回答を生成する方式です。",
      };
      return NextResponse.json({
        hasContent: true,
        ...mockQuiz,
      });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildPrompt(goal, planSummary, level),
      maxOutputTokens: 500,
    });

    const trimmed = text.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, "$1").trim();
    const parsed = JSON.parse(trimmed) as {
      type: "quiz" | "topic";
      question?: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string;
      title?: string;
      body?: string;
    };

    if (parsed.type === "quiz" && Array.isArray(parsed.options) && parsed.question) {
      const correctIndex = Math.min(3, Math.max(0, Number(parsed.correctIndex) || 0));
      return NextResponse.json({
        hasContent: true,
        type: "quiz",
        question: String(parsed.question),
        options: parsed.options.slice(0, 4),
        correctIndex,
        explanation: String(parsed.explanation ?? ""),
      });
    }

    if (parsed.type === "topic" && parsed.title) {
      return NextResponse.json({
        hasContent: true,
        type: "topic",
        title: String(parsed.title),
        body: String(parsed.body ?? ""),
      });
    }
  } catch (e) {
    console.error(e);
  }

  return NextResponse.json({
    hasContent: false,
    message: "生成に失敗しました。しばらくしてから再読み込みしてください。",
  });
}
