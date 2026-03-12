/**
 * 閲覧履歴（ニュース・トピック等）を記録。パーソナライズ精度向上用。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const KINDS = ["news_view", "topic_view", "quiz_view"] as const;

export async function POST(request: Request) {
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
  const kind =
    typeof raw.kind === "string" && KINDS.includes(raw.kind as (typeof KINDS)[number])
      ? raw.kind
      : undefined;
  const targetId = typeof raw.targetId === "string" ? raw.targetId : null;
  const metadata =
    typeof raw.metadata === "string" ? raw.metadata : raw.metadata != null ? JSON.stringify(raw.metadata) : null;

  if (!kind) {
    return NextResponse.json({ error: "kind を指定してください。" }, { status: 400 });
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      kind,
      targetId,
      metadata,
    },
  });

  return NextResponse.json({ success: true });
}
