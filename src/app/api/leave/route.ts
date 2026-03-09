/**
 * 休暇申請API: GET で自分の申請一覧を取得、POST で有給・欠勤などの申請を登録する
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leaveRequestSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const list = await prisma.leaveRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
  });
  return NextResponse.json({ list });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "リクエスト形式が不正です。" },
        { status: 400 },
      );
    }

    const parsed = leaveRequestSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "入力内容を確認してください。";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { date, type } = parsed.data;
    await prisma.leaveRequest.create({
      data: { userId: session.user.id, date, type },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "申請に失敗しました。" },
      { status: 500 },
    );
  }
}
