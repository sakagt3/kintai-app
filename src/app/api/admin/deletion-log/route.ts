/**
 * 管理者用: アカウント削除履歴一覧を返す。admin または yuohdai33@gmail.com の場合のみ許可。
 */
import { NextResponse } from "next/server";
import { auth, isAdminUser } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未認証" }, { status: 401 });
  }
  if (!isAdminUser(session)) {
    return NextResponse.json({ error: "管理者のみ利用できます" }, { status: 403 });
  }

  try {
    const logs = await prisma.accountDeletionLog.findMany({
      orderBy: { deletedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ logs });
  } catch (e) {
    console.error("[GET /api/admin/deletion-log]", e);
    return NextResponse.json({ logs: [] });
  }
}
