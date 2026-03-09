import { NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

/**
 * 新規登録API: バリデーション・重複チェック・パスワードハッシュ化のうえでユーザーを1件作成する
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

  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています。" },
      { status: 400 },
    );
  }

  const hashedPassword = hashSync(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        name: name?.trim() || null,
        password: hashedPassword,
        role: "member",
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
        contentFocus: "topic",
      },
    });
  } catch (e) {
    console.error("Register create failed:", e);
    return NextResponse.json(
      { error: "登録に失敗しました。しばらく経ってからお試しください。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
