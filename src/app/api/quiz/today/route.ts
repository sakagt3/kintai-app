/**
 * 今日のクイズ出題API。忘却曲線に基づき「復習すべき問題」を優先し、残りをランダムで補う。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getAllQuestionIds,
  getQuestionsByIds,
  type QuizQuestion,
} from "@/lib/quizBank";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });
  const limit = Math.min(
    Math.max(settings?.dailyQuizCount ?? 10, 1),
    20,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { answeredAt: "desc" },
    take: 500,
  });

  const byQuestion = new Map<string, typeof attempts>();
  for (const a of attempts) {
    if (!byQuestion.has(a.questionId)) {
      byQuestion.set(a.questionId, []);
    }
    byQuestion.get(a.questionId)!.push(a);
  }

  const allIds = getAllQuestionIds();
  const due: string[] = [];
  const wrong: string[] = [];
  const rest: string[] = [];

  for (const id of allIds) {
    const list = byQuestion.get(id) ?? [];
    const last = list[0];
    if (!last) {
      rest.push(id);
      continue;
    }
    const nextReview = last.nextReviewAt;
    if (nextReview) {
      const reviewDay = new Date(nextReview);
      reviewDay.setHours(0, 0, 0, 0);
      if (reviewDay <= today) {
        due.push(id);
      } else {
        rest.push(id);
      }
    } else {
      rest.push(id);
    }
    if (!last.correct && !due.includes(id)) {
      wrong.push(id);
    }
  }

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const dueShuffled = shuffle(due);
  const wrongFiltered = wrong.filter((id) => !dueShuffled.includes(id));
  const restFiltered = rest.filter(
    (id) => !dueShuffled.includes(id) && !wrongFiltered.includes(id),
  );
  const combined = [
    ...dueShuffled,
    ...shuffle(wrongFiltered),
    ...shuffle(restFiltered),
  ].slice(0, limit);

  const questions = getQuestionsByIds(combined).map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options,
    explanation: q.explanation,
  }));

  return NextResponse.json({ questions, date: todayStr });
}
