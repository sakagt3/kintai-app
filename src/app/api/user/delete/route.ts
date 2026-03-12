/**
 * 自分自身のアカウントを削除する。
 * 外部キー制約を解消するため、User に紐づく Attendance / LoginHistory をはじめ
 * 関連データをすべて deleteMany で一括削除してから、最後に User を削除する。
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const userId = session.user.id;
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!target) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    // User 削除前にすべての関連レコードを削除（順序は FK 制約に従う）
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { userId } }),
      prisma.loginHistory.deleteMany({ where: { userId } }),
      prisma.learningHistory.deleteMany({ where: { userId } }),
      prisma.activityLog.deleteMany({ where: { userId } }),
      prisma.quizAttempt.deleteMany({ where: { userId } }),
      prisma.leaveRequest.deleteMany({ where: { userId } }),
      prisma.userSettings.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    try {
      await prisma.accountDeletionLog.create({
        data: {
          deletedUserEmail: target.email,
          deletedUserName: target.name ?? undefined,
          deletedBy: "self",
        },
      });
    } catch {
      // テーブルが無くても削除は成功とする
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/user/delete]", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
