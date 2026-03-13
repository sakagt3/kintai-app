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

const SKIP_OPTION = "わからない（スキップ）";

type QuizItem = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isReview?: boolean;
};

/** シード付き簡易シャッフル（0..n-1 のインデックスをシャッフル） */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 正解位置をランダム化。先頭4つをシャッフルし、最後は必ず「わからない」に固定。
 */
function shuffleOptionsAndFixSkip(
  options: string[],
  correctIndex: number,
  seed: number
): { options: string[]; correctIndex: number } {
  const four = options.slice(0, 4);
  const skip = options.length > 4 ? options[4] : SKIP_OPTION;
  const indices = seededShuffle([0, 1, 2, 3], seed);
  const shuffled = indices.map((i) => four[i]);
  const newCorrectIndex = indices.indexOf(correctIndex);
  return {
    options: [...shuffled, skip],
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

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
    const opts = o.options.slice(0, 5);
    if (opts.length === 4) opts.push(SKIP_OPTION);
    const id = `review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return {
      id,
      question: String(o.question),
      options: opts,
      correctIndex: Math.min(3, Math.max(0, Number(o.correctIndex) ?? 0)),
      explanation: String(o.explanation ?? ""),
      isReview: true,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isMore = searchParams.get("more") === "1";
  const batchSeed = Number(searchParams.get("batch")) || 0;
  const isNewSession = searchParams.get("is_new_session") === "1";
  const excludeIdsRaw = searchParams.get("exclude_ids") ?? "";
  const excludeIds = excludeIdsRaw
    ? excludeIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const timestamp = Date.now();
  const uniqueId =
    searchParams.get("unique_id") ||
    `${timestamp}-${Math.random().toString(36).slice(2, 10)}`;

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
  const countParam = searchParams.get("count");
  const dailyCount =
    countParam !== null && countParam !== ""
      ? Math.min(20, Math.max(1, parseInt(countParam, 10) || 10))
      : Math.min(20, Math.max(1, settings?.dailyQuizCount ?? 10));

  const questions: QuizItem[] = [];

  const today = new Date().toISOString().slice(0, 10);

  if (!isMore && !isNewSession) {
    // 忘却曲線：過去に間違えた問題・「わからない」を選んだ問題を優先して再出題（nextReviewAt が今日以前のもの）
    const reviewCandidates = await prisma.quizAttempt.findMany({
      where: {
        userId,
        questionSnapshot: { not: null },
        nextReviewAt: { lte: new Date(`${today}T23:59:59Z`) },
      },
      orderBy: { nextReviewAt: "asc" },
      take: Math.min(Math.max(1, Math.floor(dailyCount / 3)), 5),
    });

    const usedReviewIds: string[] = [];
    for (const r of reviewCandidates) {
      const item = parseReviewSnapshot(r.questionSnapshot);
      if (item) {
        item.id = `review-${r.id}`;
        const { options, correctIndex } = shuffleOptionsAndFixSkip(
          item.options,
          item.correctIndex,
          timestamp + r.id.length + batchSeed
        );
        item.options = options;
        item.correctIndex = correctIndex;
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
  }

  let needNew = isMore ? dailyCount : dailyCount - questions.length;
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;

  // 問題バンクがあればここからランダム抽出（ダッシュボードと連携・毎回異なる問題）
  if (needNew > 0) {
    const bank = await prisma.questionBank.findUnique({
      where: { userId },
    });
    const raw = bank?.questions;
    const bankList: QuizItem[] = Array.isArray(raw)
      ? (raw as unknown[]).map((q: unknown, i: number) => {
          const x = q && typeof q === "object" ? (q as Record<string, unknown>) : {};
          return {
            id: typeof x.id === "string" ? x.id : `bank-${userId}-${i}`,
            question: String(x.question ?? ""),
            options: Array.isArray(x.options) ? (x.options as string[]) : [],
            correctIndex: Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0)),
            explanation: String(x.explanation ?? ""),
            isReview: false,
          };
        }).filter((q) => q.question && q.options.length >= 4)
      : [];
    const pool = bankList.filter(
      (q) => q.id && !excludeIds.includes(q.id)
    );
    if (pool.length >= needNew) {
      const shuffled = seededShuffle(pool, timestamp + batchSeed * 1000);
      for (let i = 0; i < needNew; i++) {
        const x = shuffled[i];
        let opts: string[] = Array.isArray(x.options) ? [...x.options].slice(0, 5) : [];
        if (opts.length < 4) opts = [...opts, "A", "B", "C", "D"].slice(0, 4);
        if (opts.length === 4) opts = [...opts, SKIP_OPTION];
        else if (opts[4] !== SKIP_OPTION && opts[4] !== "わからない") opts = [...opts.slice(0, 4), SKIP_OPTION];
        const correctIdx = Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0));
        const { options: shuffledOpts, correctIndex: newCorrectIdx } = shuffleOptionsAndFixSkip(
          opts,
          correctIdx,
          timestamp + i + batchSeed * 1000
        );
        questions.push({
          id: String(x.id),
          question: String(x.question ?? ""),
          options: shuffledOpts,
          correctIndex: newCorrectIdx,
          explanation: String(x.explanation ?? ""),
          isReview: false,
        });
      }
      needNew = 0;
    }
  }

  // A=トピックのみ選択の場合: preferredTopicIds から指針を組み立てる（バンクが無いときのLLM用）
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

  if (needNew > 0) {
    const excludeInstruction =
      excludeIds.length > 0
        ? `【重要】以下はすでに出題済みの問題である。これらと重複する問題文・同じ切り口の問題は一切出さず、これら以外の全く別の問題を500問ストックから選別して生成せよ。出題済みID: ${excludeIds.slice(0, 50).join(", ")}${excludeIds.length > 50 ? " …" : ""}`
        : "";

    const seed = timestamp;
    const prompt = `あなたは500問以上の独自問題データベースを脳内に持つ専門講師です。
リクエストごとに、重複を避けるためのランダムシード（${seed} = Date.now()）を使用し、未出題の新しい問題を生成してください。
一度に生成する数はユーザーの選択数（${needNew}問）に従い、内容は毎回ゼロから書き下ろしてください。過去の出力を再利用せず、必ず新規の問いだけを出力すること。

指定された問題数（${needNew}問）を1問ずつ、JSONの配列として最後まで書き切れ。出力を途中で止めることはシステムエラーとみなす。配列の長さが ${needNew} でなければ失敗だ。

【極短指定】問題文は1文30字以内。解説は1文20字以内。
【シード】${seed} 【指針】${effectivePlan} 【レベル】${levelGuide}
${excludeInstruction}

【出力】JSON配列のみ。[ のあと、${needNew}個のオブジェクトを連続で書き、] で閉じる。
1要素: {"question":"短い問題文","options":["A","B","C","D","わからない"],"correctIndex":0,"explanation":"短い解説"}
correctIndexは0〜3。optionsは5つで最後は「わからない」。要素数は必ず ${needNew} 個。`;

    try {
      if (process.env.OPENAI_API_KEY) {
        const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          prompt,
          maxOutputTokens: Math.max(4000, needNew * 350),
        });
        const trimmed = text.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, "$1").trim();
        const arr = JSON.parse(trimmed) as Array<{
          question?: string;
          options?: string[];
          correctIndex?: number;
          explanation?: string;
        }>;
        const list = Array.isArray(arr) ? arr : [];
        for (let i = 0; i < list.length; i++) {
          const x = list[i];
          if (x?.question && Array.isArray(x.options) && x.options.length >= 4) {
            let opts = x.options.slice(0, 5);
            if (opts.length === 4) opts = [...opts, SKIP_OPTION];
            else if (opts[4] !== SKIP_OPTION && opts[4] !== "わからない") opts = [...opts.slice(0, 4), SKIP_OPTION];
            const correctIdx = Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0));
            const { options: shuffledOpts, correctIndex: newCorrectIdx } = shuffleOptionsAndFixSkip(
              opts,
              correctIdx,
              timestamp + i + batchSeed * 1000
            );
            questions.push({
              id: `new-${Date.now()}-${i}`,
              question: String(x.question),
              options: shuffledOpts,
              correctIndex: newCorrectIdx,
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
          const { options: shuffledOpts, correctIndex: newCorrectIdx } = shuffleOptionsAndFixSkip(
            t.options,
            t.correctIndex,
            timestamp + i + batchSeed * 1000
          );
          questions.push({
            ...t,
            id: `new-${Date.now()}-${i}`,
            options: shuffledOpts,
            correctIndex: newCorrectIdx,
          });
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

  return NextResponse.json(
    {
      questions,
      retentionRate,
      dailyQuizCount: dailyCount,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    }
  );
}
