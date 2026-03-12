/**
 * 管理者用: 指定ユーザーの role を更新する。
 * 実行者が admin または yuohdai33@gmail.com であることをサーバーで検証する。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth, isAdminUser } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["admin", "member"] as const;

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }
    if (!isAdminUser(session)) {
      return NextResponse.json({ error: "管理者のみ実行できます" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const role = typeof body.role === "string" && ALLOWED_ROLES.includes(body.role as (typeof ALLOWED_ROLES)[number]) ? body.role : null;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId と role（admin または member）を指定してください" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({ success: true, role });
  } catch (e) {
    console.error("[PATCH /api/admin/update-role]", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
