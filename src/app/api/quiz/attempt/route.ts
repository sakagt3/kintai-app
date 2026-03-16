/**
 * クイズ回答を保存し、エビングハウスの忘却曲線に基づく次回復習日（nextReviewAt）を設定する。
 * 正解時は attemptCount（その問題の正解回数）に応じて 1日後→3日後→7日後→14日後→30日後 と間隔を伸ばす。
 * 不正解・「わからない」選択時は常に翌日（+1日）で再出題する。
 */
export const dynamic = "force-dynamic";
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
  // これまでの正解回数（attemptCount）を取得
  const pastAttempts = await prisma.quizAttempt.findMany({
    where: { userId, questionId },
    select: { correct: true },
  });
  const successCount = pastAttempts.filter((a) => a.correct).length;

  let daysToAdd: number;
  if (!correct) {
    // 不正解・「わからない」は常に翌日
    daysToAdd = 1;
  } else {
    // 正解回数に応じて 1→3→7→14→30 日と伸ばす（5段階目以降は 30日に固定）
    switch (successCount) {
      case 0:
        daysToAdd = 1;
        break;
      case 1:
        daysToAdd = 3;
        break;
      case 2:
        daysToAdd = 7;
        break;
      case 3:
        daysToAdd = 14;
        break;
      default:
        daysToAdd = 30;
        break;
    }
  }
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
