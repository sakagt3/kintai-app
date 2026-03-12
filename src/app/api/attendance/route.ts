/**
 * 勤怠API: GET で当日・直近7日分の勤怠を取得、POST で出勤・退勤・休憩開始・休憩終了を打刻する
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { attendancePunchSchema } from "@/lib/validations";

/** JST で今日の日付文字列 (YYYY-MM-DD) を返す */
function getTodayDateString() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/** 今日から過去7日分の日付文字列の配列を返す */
function getLast7DaysDateStrings() {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    dates.push(jst.toISOString().slice(0, 10));
  }
  return dates;
}

/** 当月（JST）の全日付 YYYY-MM-DD の配列を返す */
function getCurrentMonthDateStrings() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const dates: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    dates.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return dates;
}

type HistoryRecord = {
  clockIn: string | null;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
};

/** 空の勤怠レスポンス（認証・DB 失敗時もクライアントが同じ形で受け取り表示エラーを防ぐ） */
function emptyAttendanceResponse() {
  const today = getTodayDateString();
  const last7Dates = getLast7DaysDateStrings();
  const monthDates = getCurrentMonthDateStrings();
  return NextResponse.json({
    today: {
      date: today,
      clockIn: null,
      clockOut: null,
      breakStart: null,
      breakEnd: null,
    },
    last7Dates,
    historyByDate: {} as Record<string, HistoryRecord>,
    monthDates,
    monthlyByDate: {} as Record<string, HistoryRecord>,
  });
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return emptyAttendanceResponse();
    }
    const today = getTodayDateString();
    const last7Dates = getLast7DaysDateStrings();
    const monthDates = getCurrentMonthDateStrings();
    const [todayAttendance, historyRecords, monthlyRecords] = await Promise.all([
      prisma.attendance.findFirst({
        where: { userId: session.user.id, date: today },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attendance.findMany({
        where: { userId: session.user.id, date: { in: last7Dates } },
        orderBy: { date: "desc" },
      }),
      prisma.attendance.findMany({
        where: { userId: session.user.id, date: { in: monthDates } },
        orderBy: { date: "asc" },
      }),
    ]);
    const toRecord = (
      r: { clockIn: string | null; clockOut: string | null; [k: string]: unknown }
    ): HistoryRecord => ({
      clockIn: r.clockIn,
      clockOut: r.clockOut,
      breakStart: (r as { breakStart?: string | null }).breakStart ?? null,
      breakEnd: (r as { breakEnd?: string | null }).breakEnd ?? null,
    });
    const historyByDate = Object.fromEntries(
      historyRecords.map((r) => [r.date, toRecord(r)]),
    );
    const monthlyByDate = Object.fromEntries(
      monthlyRecords.map((r) => [r.date, toRecord(r)]),
    );
    const ext = (x: { clockIn: string | null; clockOut: string | null }) =>
      x as { breakStart?: string | null; breakEnd?: string | null };
    return NextResponse.json({
      today: todayAttendance
        ? {
            date: today,
            clockIn: todayAttendance.clockIn,
            clockOut: todayAttendance.clockOut,
            breakStart: ext(todayAttendance).breakStart ?? null,
            breakEnd: ext(todayAttendance).breakEnd ?? null,
          }
        : {
            date: today,
            clockIn: null,
            clockOut: null,
            breakStart: null,
            breakEnd: null,
          },
      last7Dates,
      historyByDate,
      monthDates,
      monthlyByDate,
    });
  } catch (e) {
    console.error("[GET /api/attendance]", e);
    return emptyAttendanceResponse();
  }
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

    const parsed = attendancePunchSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "打刻種別を指定してください。";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { type, latitude, longitude } = parsed.data;
    const location =
      latitude != null && longitude != null
        ? `${latitude},${longitude}`
        : (parsed.data.location ?? null);

    const userId = session.user.id;
    const now = new Date();
    const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const date = jstNow.toISOString().split("T")[0];
    const time = jstNow.toISOString().split("T")[1].substring(0, 5);

    const existing = await prisma.attendance.findFirst({
      where: { userId, date },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      if (type === "CLOCK_IN") {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { clockIn: time, ...(location && { note: location }) },
        });
      } else if (type === "CLOCK_OUT") {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            clockOut: time,
            note: location
              ? `${existing.note ?? ""}, ${location}`.trim()
              : existing.note,
          },
        });
      } else if (type === "BREAK_START") {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { breakStart: time } as Parameters<typeof prisma.attendance.update>[0]["data"],
        });
      } else {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: { breakEnd: time } as Parameters<typeof prisma.attendance.update>[0]["data"],
        });
      }
    } else {
      await prisma.attendance.create({
        data: {
          userId,
          date,
          ...(type === "CLOCK_IN" && { clockIn: time, note: location }),
          ...(type === "CLOCK_OUT" && { clockOut: time, note: location }),
          ...(type === "BREAK_START" && { breakStart: time }),
          ...(type === "BREAK_END" && { breakEnd: time }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
