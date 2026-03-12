/**
 * 勤怠履歴API: 指定年月の打刻一覧を返す（打刻履歴専用ページ用）
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getMonthDateStrings(year: number, month: number): string[] {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates: string[] = [];
  const m = String(month).padStart(2, "0");
  for (let d = 1; d <= lastDay; d++) {
    dates.push(`${year}-${m}-${String(d).padStart(2, "0")}`);
  }
  return dates;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const y = Number(searchParams.get("year"));
    const m = Number(searchParams.get("month"));
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
      return NextResponse.json({ error: "year, month を指定してください" }, { status: 400 });
    }
    const monthDates = getMonthDateStrings(y, m);
    const records = await prisma.attendance.findMany({
      where: { userId: session.user.id, date: { in: monthDates } },
      orderBy: { date: "asc" },
    });
    const byDate: Record<string, { clockIn: string | null; clockOut: string | null; breakStart: string | null; breakEnd: string | null }> = {};
    records.forEach((r) => {
      byDate[r.date] = {
        clockIn: r.clockIn,
        clockOut: r.clockOut,
        breakStart: (r as { breakStart?: string | null }).breakStart ?? null,
        breakEnd: (r as { breakEnd?: string | null }).breakEnd ?? null,
      };
    });
    return NextResponse.json({ year: y, month: m, monthDates, byDate });
  } catch (e) {
    console.error("[GET /api/attendance/range]", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
