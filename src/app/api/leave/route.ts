import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  const list = await prisma.leaveRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
  })
  return NextResponse.json({ list })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  try {
    const body = await request.json()
    const date = body?.date
    const type = body?.type
    if (!date || typeof date !== "string") {
      return NextResponse.json({ error: "日付を選択してください。" }, { status: 400 })
    }
    if (type !== "有給" && type !== "欠勤") {
      return NextResponse.json({ error: "種別は「有給」または「欠勤」を選択してください。" }, { status: 400 })
    }
    await prisma.leaveRequest.create({
      data: { userId: session.user.id, date, type },
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "申請に失敗しました。" }, { status: 500 })
  }
}
