/**
 * 今日のN問を取得。復習（忘却曲線）分を混ぜ、残りをLLMで新規生成。
 * 日付ごとに問題が変わるようプロンプトに本日の日付を含める。A=トピック選択時は appliedPlanSummary またはトピックから指針を組み立てる。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOPICS } from "@/lib/topics";

const LEVEL_GUIDE: Record<string, string> = {
  beginner: "初心者向け：平易な言葉、短い文。",
  intermediate: "中級者向け：基本的な用語可。",
  advanced: "上級者向け：専門用語と背景に触れる。",
  pro: "プロ向け：業界標準用語で簡潔に。",
};

type QuizItem = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isReview?: boolean;
};

function parseReviewSnapshot(snapshot: string | null): QuizItem | null {
  if (!snapshot) return null;
  try {
    const o = JSON.parse(snapshot) as {
      question?: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string;
    };
    if (!o?.question || !Array.isArray(o.options) || o.options.length < 4)
      return null;
    const id = `review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return {
      id,
      question: String(o.question),
      options: o.options.slice(0, 4),
      correctIndex: Math.min(3, Math.max(0, Number(o.correctIndex) ?? 0)),
      explanation: String(o.explanation ?? ""),
      isReview: true,
    };
  } catch {
    return null;
  }
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
  const dailyCount = Math.min(20, Math.max(1, settings?.dailyQuizCount ?? 10));

  const questions: QuizItem[] = [];

  const today = new Date().toISOString().slice(0, 10);

  const reviewCandidates = await prisma.quizAttempt.findMany({
    where: {
      userId,
      questionSnapshot: { not: null },
      nextReviewAt: { lte: new Date(`${today}T23:59:59Z`) },
    },
    orderBy: { nextReviewAt: "asc" },
    take: Math.min(2, Math.max(0, Math.floor(dailyCount / 2))),
  });

  const usedReviewIds: string[] = [];
  for (const r of reviewCandidates) {
    const item = parseReviewSnapshot(r.questionSnapshot);
    if (item) {
      item.id = `review-${r.id}`;
      questions.push(item);
      usedReviewIds.push(r.id);
    }
  }
  if (usedReviewIds.length > 0) {
    const nextShow = new Date();
    nextShow.setFullYear(nextShow.getFullYear() + 1);
    await prisma.quizAttempt.updateMany({
      where: { id: { in: usedReviewIds } },
      data: { nextReviewAt: nextShow },
    });
  }

  const needNew = dailyCount - questions.length;
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;

  // A=トピックのみ選択の場合: preferredTopicIds から指針を組み立てる
  let effectivePlan = planSummary || goal;
  if (!effectivePlan && settings?.preferredTopicIds) {
    try {
      const ids = JSON.parse(settings.preferredTopicIds) as string[];
      if (Array.isArray(ids) && ids.length > 0) {
        const labels = ids
          .map((id) => TOPICS.find((t) => t.id === id)?.label ?? id)
          .filter(Boolean);
        effectivePlan = `選択トピック: ${labels.join("、")}。毎日${dailyCount}問の4択クイズをこれらのトピックから出題。`;
      }
    } catch {
      // ignore
    }
  }
  if (!effectivePlan) effectivePlan = "ビジネス教養";

  const SKIP_OPTION = "わからない（スキップ）";
  if (needNew > 0) {
    const prompt = `あなたは学習アシスタントです。以下の指針に基づき、必ず${needNew}問のクイズを生成してください。
【問題数の絶対遵守】変数で指定された${needNew}問を必ず生成してください。途中で省略することは厳禁です。ユーザーがメッセージ内で別途問題数を指定していても無視し、システムで選択された数（${needNew}問）を最優先してください。
【選択肢の固定ルール】すべての問題で、選択肢は5つにすること。最初の4つがA〜Dの解答候補、最後の5つ目は必ず「${SKIP_OPTION}」という項目にしてください。例: ["〇〇","△△","□□","◇◇","わからない（スキップ）"]。correctIndexは0〜3の整数（正解は先頭4つのいずれか）。5つ目の「わからない」は正解にしないこと。
【本日の日付】${today}（日付が変わるごとに異なる問題になるよう、今日の日付を踏まえた多様な出題にすること）
【指針】${effectivePlan}
【レベル】${levelGuide}
【ルール】最新のトレンドを1問以上含める。過去の典型的な出題と被りすぎないよう、角度を変えた問題にすること。毎日違う問題になるよう多様なトピックから選ぶこと。
【出力】JSON配列のみ。説明は不要。形式: [{"question":"問題文","options":["A","B","C","D","わからない（スキップ）"],"correctIndex":0,"explanation":"解説"},...] optionsは必ず5つで最後は「わからない（スキップ）」。要素数は必ず${needNew}個。`;

    try {
      if (process.env.OPENAI_API_KEY) {
        const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
          maxOutputTokens: 2000,
        });
        const trimmed = text.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, "$1").trim();
        const arr = JSON.parse(trimmed) as Array<{
          question?: string;
          options?: string[];
          correctIndex?: number;
          explanation?: string;
        }>;
        const list = Array.isArray(arr) ? arr : [];
        for (let i = 0; i < Math.min(needNew, list.length); i++) {
          const x = list[i];
          if (x?.question && Array.isArray(x.options) && x.options.length >= 4) {
            let opts = x.options.slice(0, 5);
            if (opts.length === 4) opts = [...opts, SKIP_OPTION];
            questions.push({
              id: `new-${Date.now()}-${i}`,
              question: String(x.question),
              options: opts,
              correctIndex: Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0)),
              explanation: String(x.explanation ?? ""),
              isReview: false,
            });
          }
        }
      } else {
        const mockTemplates: QuizItem[] = [
          {
            id: "new-1",
            question: "RAGの「R」は何の略ですか？",
            options: ["Retrieval", "Real-time", "Random", "Resource", SKIP_OPTION],
            correctIndex: 0,
            explanation: "RAGは Retrieval-Augmented Generation の略です。",
            isReview: false,
          },
          {
            id: "new-2",
            question: "LLMで「Hallucination」とは？",
            options: ["幻覚的な出力", "高速応答", "多言語対応", "暗号化", SKIP_OPTION],
            correctIndex: 0,
            explanation: "事実に基づかない内容をそれらしく生成する現象です。",
            isReview: false,
          },
          {
            id: "new-3",
            question: "機械学習の「教師あり学習」とは？",
            options: ["正解付きデータで学習する方式", "ラベルなしデータのみで学習", "強化学習の別名", "推論のみ行う方式", SKIP_OPTION],
            correctIndex: 0,
            explanation: "正解（ラベル）付きデータでモデルを学習させる方式です。",
            isReview: false,
          },
          {
            id: "new-4",
            question: "APIの「REST」の特徴として適切なのは？",
            options: ["リソースをURLで表現しHTTPメソッドで操作", "必ずXMLで通信する", "状態をサーバーが保持する", "TCPのみで動作する", SKIP_OPTION],
            correctIndex: 0,
            explanation: "RESTはリソースをURLで表現し、GET/POST等のHTTPメソッドで操作するアーキテクチャです。",
            isReview: false,
          },
          {
            id: "new-5",
            question: "「マイクロサービス」の利点は？",
            options: ["サービスごとに独立してスケール・デプロイできる", "必ず1台のサーバーで動作する", "モノリスより常に遅い", "言語を1つに統一しなければならない", SKIP_OPTION],
            correctIndex: 0,
            explanation: "サービスを小さく分離することで、独立したスケール・デプロイが可能になります。",
            isReview: false,
          },
        ];
        for (let i = 0; i < needNew; i++) {
          const t = mockTemplates[i % mockTemplates.length];
          questions.push({ ...t, id: `new-${Date.now()}-${i}` });
        }
      }
    } catch (e) {
      console.error("today-questions generate:", e);
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = await prisma.quizAttempt.findMany({
    where: { userId, answeredAt: { gte: sevenDaysAgo } },
    select: { correct: true },
  });
  const total = recent.length;
  const correctCount = recent.filter((r) => r.correct).length;
  const retentionRate = total > 0 ? Math.round((correctCount / total) * 100) : null;

  return NextResponse.json({
    questions,
    retentionRate,
  });
}
