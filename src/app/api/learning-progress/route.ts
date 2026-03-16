export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  const bank = await prisma.questionBank.findUnique({
    where: { userId },
  });

  const raw = bank?.questions;
  let rawArr: unknown[] = [];
  if (Array.isArray(raw)) {
    rawArr = raw;
  } else if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
    rawArr = Object.values(raw);
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      rawArr = Array.isArray(parsed) ? parsed : [];
    } catch {
      rawArr = [];
    }
  }

  const questions = rawArr
    .map((q: unknown, i: number) => {
      const x = q && typeof q === "object" ? (q as Record<string, unknown>) : {};
      return {
        id: typeof x.id === "string" ? x.id : `bank-${userId}-${i}`,
      };
    })
    .filter((q) => q.id);

  const totalCount = questions.length;

  if (totalCount === 0) {
    return NextResponse.json({
      masteredCount: 0,
      totalCount: 0,
      todayTotal: 0,
      todayCorrect: 0,
      isComplete: false,
    });
  }

  const ids = questions.map((q) => q.id);
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      questionId: { in: ids },
    },
    orderBy: { answeredAt: "desc" },
  });

  const lastAttemptByQuestion = new Map<string, (typeof attempts)[number]>();
  for (const a of attempts) {
    if (!lastAttemptByQuestion.has(a.questionId)) {
      lastAttemptByQuestion.set(a.questionId, a);
    }
  }

  const now = new Date();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  let masteredCount = 0;

  for (const q of questions) {
    const last = lastAttemptByQuestion.get(q.id);
    if (!last || !last.nextReviewAt || !last.correct) continue;
    const diff = last.nextReviewAt.getTime() - now.getTime();
    if (diff >= THIRTY_DAYS_MS) {
      masteredCount += 1;
    }
  }

  const isComplete = totalCount >= 100 && masteredCount >= 100;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayAttempts = attempts.filter(
    (a) => a.answeredAt >= today && a.answeredAt < tomorrow,
  );
  const todayTotal = todayAttempts.length;
  const todayCorrect = todayAttempts.filter((a) => a.correct).length;

  return NextResponse.json({
    masteredCount,
    totalCount,
    todayTotal,
    todayCorrect,
    isComplete,
  });
}

