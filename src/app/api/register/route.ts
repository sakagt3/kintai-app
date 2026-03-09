import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

/**
 * 新規登録API: Zodでバリデーションし、ユーザーを1件作成する
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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています。" },
      { status: 400 },
    );
  }

  try {
    await prisma.user.create({
      data: {
        email,
        name: name?.trim() || null,
        password,
        role: "member",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "登録に失敗しました。しばらく経ってからお試しください。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
