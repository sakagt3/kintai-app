/**
 * 設定API: GET でユーザー設定・プロフィール取得、PATCH で設定・名前を更新する。
 * 設定が未作成の場合はデフォルトで作成して返す。
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DISPLAY_MODES = ["standard", "detail_special", "detail_news"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        showSpecialDay: true,
        showAiNews: true,
        displayMode: "standard",
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return NextResponse.json({
    settings: {
      showSpecialDay: settings.showSpecialDay,
      showAiNews: settings.showAiNews,
      displayMode: settings.displayMode,
    },
    profile: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const showSpecialDay =
    typeof raw.showSpecialDay === "boolean" ? raw.showSpecialDay : undefined;
  const showAiNews =
    typeof raw.showAiNews === "boolean" ? raw.showAiNews : undefined;
  const displayMode =
    typeof raw.displayMode === "string" && DISPLAY_MODES.includes(raw.displayMode as (typeof DISPLAY_MODES)[number])
      ? raw.displayMode
      : undefined;
  const name = typeof raw.name === "string" ? raw.name.trim() : undefined;

  const userId = session.user.id;

  // 設定の upsert
  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      showSpecialDay: showSpecialDay ?? true,
      showAiNews: showAiNews ?? true,
      displayMode: (displayMode as (typeof DISPLAY_MODES)[number]) ?? "standard",
    },
    update: {
      ...(showSpecialDay !== undefined && { showSpecialDay }),
      ...(showAiNews !== undefined && { showAiNews }),
      ...(displayMode !== undefined && { displayMode }),
    },
  });

  if (name !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name || null },
    });
  }

  return NextResponse.json({ success: true });
}
