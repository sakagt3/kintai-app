/**
 * 忘却曲線に基づく「次回復習予定」一覧。インジケーター表示用。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQuestionById } from "@/lib/quizBank";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId: session.user.id,
      nextReviewAt: { not: null, gte: today, lte: in7Days },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 100,
  });

  const byQuestion = new Map<string, { nextReviewAt: Date }>();
  for (const a of attempts) {
    if (!byQuestion.has(a.questionId))
      byQuestion.set(a.questionId, { nextReviewAt: a.nextReviewAt! });
  }

  const items = Array.from(byQuestion.entries()).slice(0, 20).map(([questionId, { nextReviewAt }]) => {
    const q = getQuestionById(questionId);
    const next = nextReviewAt;
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / 86400000);
    return {
      questionId,
      questionShort: q?.question?.slice(0, 40) ?? questionId,
      nextReviewAt: next.toISOString().slice(0, 10),
      daysUntil: diffDays,
    };
  });

  return NextResponse.json({ items });
}
