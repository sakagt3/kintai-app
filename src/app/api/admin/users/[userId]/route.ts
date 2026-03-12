/**
 * 管理者用: 指定ユーザー（アカウント）を削除する。
 * 実行者が admin または yuohdai33@gmail.com であることをサーバーで検証する。
 * 削除履歴は可能なら記録（テーブルが無くても削除は成功させる）。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth, isAdminUser } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }
    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "管理者のみ実行できます" }, { status: 403 });
    }

    const { userId } = await params;
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId を指定してください" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (!target) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const adminId = session.user.id;
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
          deletedBy: "admin",
          deletedByUserId: adminId,
        },
      });
    } catch (logErr) {
      console.error("[DELETE /api/admin/users/[userId]] deletion log create failed (table may be missing):", logErr);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/users/[userId]]", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
