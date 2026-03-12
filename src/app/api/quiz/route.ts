/**
 * クイズ回答送信API。選択肢のインデックスを受け取り正解か判定し、
 * エビングハウスに基づく次回復習日を計算して記録する。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getQuestionById } from "@/lib/quizBank";
import { computeNextReviewAt } from "@/lib/ebbinghaus";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です。" }, {
      status: 400,
    });
  }

  const raw = body as Record<string, unknown>;
  const questionId =
    typeof raw.questionId === "string" ? raw.questionId : undefined;
  const selectedIndex =
    typeof raw.selectedIndex === "number" &&
    raw.selectedIndex >= 0 &&
    raw.selectedIndex <= 3
      ? raw.selectedIndex
      : undefined;

  if (!questionId || selectedIndex === undefined) {
    return NextResponse.json(
      { error: "questionId と selectedIndex (0-3) を指定してください。" },
      { status: 400 },
    );
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return NextResponse.json({ error: "無効な問題IDです。" }, { status: 400 });
  }

  const correct = selectedIndex === question.correctIndex;
  const userId = session.user.id;

  const lastAttempts = await prisma.quizAttempt.findMany({
    where: { userId, questionId },
    orderBy: { answeredAt: "desc" },
    take: 10,
    select: { correct: true, nextReviewAt: true },
  });

  const answeredAt = new Date();
  const nextReviewAt = computeNextReviewAt(
    answeredAt,
    correct,
    lastAttempts.map((a) => ({
      correct: a.correct,
      nextReviewAt: a.nextReviewAt,
    })),
  );

  await prisma.quizAttempt.create({
    data: {
      userId,
      questionId,
      correct,
      answeredAt,
      nextReviewAt,
    },
  });

  return NextResponse.json({
    success: true,
    correct,
    nextReviewAt: nextReviewAt?.toISOString() ?? null,
    explanation: question.explanation,
  });
}
