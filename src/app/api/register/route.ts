import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    )
  }

  const name = body.name?.trim()
  const email = body.email?.trim()
  const password = body.password

  if (!email) {
    return NextResponse.json(
      { error: "メールアドレスを入力してください。" },
      { status: 400 }
    )
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上で入力してください。" },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  })
  if (existing) {
    return NextResponse.json(
      { error: "このメールアドレスは既に登録されています。" },
      { status: 400 }
    )
  }

  try {
    await prisma.user.create({
      data: {
        email,
        name: name || null,
        password,
        role: "member",
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "登録に失敗しました。しばらく経ってからお試しください。" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
