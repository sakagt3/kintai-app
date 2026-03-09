/**
 * クイズ回答を保存し、忘却曲線に基づく次回復習日（nextReviewAt）を設定する。
 * 正解: +3日、不正解: +1日で再出題。
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const questionId = typeof raw.questionId === "string" ? raw.questionId : "";
  const correct = raw.correct === true;
  const questionSnapshot =
    typeof raw.questionSnapshot === "string" ? raw.questionSnapshot : null;

  if (!questionId) {
    return NextResponse.json(
      { error: "questionId が必要です" },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const now = new Date();
  const daysToAdd = correct ? 3 : 1;
  const nextReviewAt = new Date(now);
  nextReviewAt.setDate(nextReviewAt.getDate() + daysToAdd);

  await prisma.quizAttempt.create({
    data: {
      userId,
      questionId,
      correct,
      questionSnapshot,
      nextReviewAt,
    },
  });

  return NextResponse.json({ success: true });
}
