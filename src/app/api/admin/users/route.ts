/**
 * 管理者用: 全ユーザー一覧を返す。admin または yuohdai33@gmail.com の場合のみ許可。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth, isAdminUser } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }
    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "管理者のみ参照できます" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
