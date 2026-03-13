/**
 * 学習履歴（プラン適用）を保存。パーソナライズ・生成AIのコンテキスト用。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const KINDS = ["plan_apply"] as const;

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
  const payload =
    raw.payload !== undefined ? JSON.stringify(raw.payload) : "{}";

  if (!kind) {
    return NextResponse.json({ error: "kind を指定してください。" }, { status: 400 });
  }

  await prisma.learningHistory.create({
    data: {
      userId: session.user.id,
      kind,
      payload,
    },
  });

  return NextResponse.json({ success: true });
}
