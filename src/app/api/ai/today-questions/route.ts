/**
 * 今日のN問を取得。復習（忘却曲線）分を混ぜ、残りをLLMで新規生成。
 * 日付ごとに問題が変わるようプロンプトに本日の日付を含める。A=トピック選択時は appliedPlanSummary またはトピックから指針を組み立てる。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
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

function jsonOptionsToStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
  const now = new Date();

  // 問題バンク（1問1レコード）を取得
  const bankRows = await prisma.questionBank.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const bankList: QuizItem[] = bankRows
    .map((row) => ({
      id: row.id,
      question: row.question,
      options: jsonOptionsToStrings(row.options),
      correctIndex: Math.min(3, Math.max(0, row.correctIndex)),
      explanation: row.explanation,
      isReview: false,
    }))
    .filter((q) => q.question && q.options.length >= 4 && !excludeIds.includes(q.id));

  // バンクが存在しない場合は空配列を返す
  if (bankList.length === 0) {
    return NextResponse.json(
      {
        questions: [],
        retentionRate: null,
        dailyQuizCount: dailyCount,
        is_complete: false,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Pragma": "no-cache",
        },
      }
    );
  }

  // 各問題の最新の回答履歴を取得
  const questionIds = bankList.map((q) => q.id);
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      questionId: { in: questionIds },
    },
    orderBy: { answeredAt: "desc" },
  });

  const lastAttemptByQuestion = new Map<string, (typeof attempts)[number]>();
  for (const a of attempts) {
    if (!lastAttemptByQuestion.has(a.questionId)) {
      lastAttemptByQuestion.set(a.questionId, a);
    }
  }

  // 進捗（定着済み / 未出題 / 要復習）を分類
  const due: typeof bankList = [];
  const never: typeof bankList = [];
  const future: typeof bankList = [];
  let masteredCount = 0;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  for (const q of bankList) {
    const last = lastAttemptByQuestion.get(q.id);
    if (!last || !last.nextReviewAt) {
      // 未出題
      never.push(q);
      continue;
    }
    const diff = last.nextReviewAt.getTime() - now.getTime();
    if (diff >= THIRTY_DAYS_MS && last.correct) {
      masteredCount += 1;
    }
    if (last.nextReviewAt <= now) {
      // 復習期限到来
      due.push(q);
    } else {
      future.push(q);
    }
  }

  const totalCount = bankList.length;
  const isComplete = totalCount >= 100 && masteredCount >= 100;

  // 出題優先順位: 復習期限が来た問題 → 未回答 → それ以外
  const pickOrder: typeof bankList = [
    ...due.sort((a, b) => {
      const la = lastAttemptByQuestion.get(a.id);
      const lb = lastAttemptByQuestion.get(b.id);
      return (la?.nextReviewAt?.getTime() ?? 0) - (lb?.nextReviewAt?.getTime() ?? 0);
    }),
    ...never,
    ...future,
  ];

  const toPick = Math.min(dailyCount, pickOrder.length);
  for (let i = 0; i < toPick; i++) {
    const x = pickOrder[i];
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
      isReview: !!lastAttemptByQuestion.get(x.id),
    });
  }

  // 直近7日間の定着率
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
      is_complete: isComplete,
      masteredCount,
      totalCount,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    }
  );
}
