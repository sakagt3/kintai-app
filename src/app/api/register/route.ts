import { NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

/**
 * 新規登録API: バリデーション・重複チェック・パスワードハッシュ化のうえでユーザーを1件作成する。
 * DATABASE_URL（Transaction pooler）を参照する共通 prisma を使用するため、Vercel 等サーバーレスでも接続可能。
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "入力内容を確認してください。";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const emailLower = email.trim().toLowerCase();
  const hashedPassword = hashSync(password, 10);
  const isAdminEmail = emailLower === "yuohdai33@gmail.com";
  const role = isAdminEmail ? "admin" : "member";

  try {
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。" },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        name: name?.trim() || null,
        password: hashedPassword,
        role,
      },
    });

    await prisma.userSettings.create({
      data: {
        userId: user.id,
        showSpecialDay: true,
        showAiNews: true,
        showAiTerm: true,
        showAppliedPlan: true,
        displayMode: "standard",
        displayVolume: "simple",
        dailyQuizCount: 5,
        learningLevel: "intermediate",
        contentFocus: "quiz",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const err = e as Error & { code?: string; meta?: unknown; message?: string };
    const detail = err?.message ?? String(e);
    console.error("Register create failed:", detail, err?.code, err?.meta);
    return NextResponse.json(
      { error: `登録に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
