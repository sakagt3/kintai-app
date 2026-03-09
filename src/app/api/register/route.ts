import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { registerSchema } from "@/lib/validations";

/**
 * 登録API用: リクエスト時に DIRECT_URL を参照して接続（Supabase プーラー回避）
 * .env の値が "postgresql://..." のように引用符付きで入っている場合に対応
 */
function getPrisma() {
  let url = (process.env.DIRECT_URL || process.env.DATABASE_URL || "").trim();
  url = url.replace(/^["']|["']$/g, "");
  if (!url || (!url.startsWith("postgresql://") && !url.startsWith("postgres://"))) {
    throw new Error("DIRECT_URL または DATABASE_URL が postgresql:// で始まる有効なURLではありません");
  }
  if (url.includes("supabase") && !url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

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
  const hashedPassword = hashSync(password, 10);

  const prisma = getPrisma();
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

    await prisma.$disconnect();
    return NextResponse.json({ success: true });
  } catch (e) {
    await prisma.$disconnect().catch(() => {});
    const err = e as Error & { code?: string; meta?: unknown; message?: string };
    const detail = err?.message ?? String(e);
    console.error("Register create failed:", detail, err?.code, err?.meta);
    return NextResponse.json(
      { error: `登録に失敗しました: ${detail}` },
      { status: 500 },
    );
  }
}
