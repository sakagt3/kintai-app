import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const { type, location } = await request.json();
    const userId = session.user.id;
    const now = new Date();
    // 日本時間に調整
    const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const date = jstNow.toISOString().split("T")[0]; // YYYY-MM-DD
    const time = jstNow.toISOString().split("T")[1].substring(0, 5); // HH:mm

    if (type === "CLOCK_IN") {
      await prisma.attendance.create({
        data: {
          userId,
          date,
          clockIn: time,
          note: location || null,
        },
      });
    } else if (type === "CLOCK_OUT") {
      const existing = await prisma.attendance.findFirst({
        where: { userId, date },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            clockOut: time,
            note: location ? `${existing.note || ""}, ${location}` : existing.note,
          },
        });
      } else {
        await prisma.attendance.create({
          data: {
            userId,
            date,
            clockOut: time,
            note: location || null,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}