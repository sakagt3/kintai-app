import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

function getTodayDateString() {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

function getLast7DaysDateStrings() {
  const dates: string[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    dates.push(jst.toISOString().slice(0, 10))
  }
  return dates
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }
  const today = getTodayDateString()
  const last7Dates = getLast7DaysDateStrings()
  const [todayAttendance, historyRecords] = await Promise.all([
    prisma.attendance.findFirst({
      where: { userId: session.user.id, date: today },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendance.findMany({
      where: { userId: session.user.id, date: { in: last7Dates } },
      orderBy: { date: "desc" },
    }),
  ])
  const historyByDate = Object.fromEntries(
    historyRecords.map((r) => [r.date, { clockIn: r.clockIn, clockOut: r.clockOut }])
  )
  return NextResponse.json({
    today: todayAttendance
      ? {
          date: today,
          clockIn: todayAttendance.clockIn,
          clockOut: todayAttendance.clockOut,
        }
      : { date: today, clockIn: null, clockOut: null },
    last7Dates,
    historyByDate,
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const type = body?.type
    const location = body?.location ?? (body?.latitude != null && body?.longitude != null
      ? `${body.latitude},${body.longitude}`
      : null)

    if (type !== "CLOCK_IN" && type !== "CLOCK_OUT") {
      return NextResponse.json(
        { error: "打刻種別（CLOCK_IN / CLOCK_OUT）を指定してください。" },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const now = new Date()
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const date = jstNow.toISOString().split("T")[0]
    const time = jstNow.toISOString().split("T")[1].substring(0, 5)

    const existing = await prisma.attendance.findFirst({
      where: { userId, date },
      orderBy: { createdAt: "desc" },
    })

    if (existing) {
      if (type === "CLOCK_IN") {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { clockIn: time, ...(location && { note: location }) },
        })
      } else {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            clockOut: time,
            note: location ? `${existing.note ?? ""}, ${location}`.trim() : existing.note,
          },
        })
      }
    } else {
      await prisma.attendance.create({
        data: {
          userId,
          date,
          ...(type === "CLOCK_IN"
            ? { clockIn: time, note: location }
            : { clockOut: time, note: location }),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}
