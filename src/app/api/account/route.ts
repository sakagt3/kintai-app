/**
 * 自分自身のアカウントを削除する。User 削除前に Attendance / LoginHistory 等を
 * deleteMany で一括削除。削除履歴は可能なら記録（テーブルが無くても削除は成功させる）。
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
      select: { email: true, name: true },
    });
    if (!target) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

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
    } catch (logErr) {
      console.error("[DELETE /api/account] deletion log create failed (table may be missing):", logErr);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/account]", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
