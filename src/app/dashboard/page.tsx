import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PunchButtons } from "./PunchButtons"

function getTodayDateString() {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().slice(0, 10)
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-")
  return `${y}年${Number(m)}月${Number(d)}日`
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const today = getTodayDateString()
  const attendance = await prisma.attendance.findFirst({
    where: { userId: session.user.id, date: today },
  })

  const historyItems = [
    { label: "出勤", time: attendance?.clockIn ?? "—", type: "in" },
    { label: "退勤", time: attendance?.clockOut ?? "—", type: "out" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">
            勤怠管理システム
          </h1>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-10">
        <p className="text-gray-600 text-sm mb-6">
          ようこそ、{session.user?.name ?? session.user?.email} さん
        </p>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            今日の打刻
          </h2>
          <PunchButtons />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            今日の打刻履歴
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {formatDisplayDate(today)}
          </p>
          <ul className="space-y-3">
            {historyItems.map((item) => (
              <li
                key={item.type}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
                <span
                  className={`text-sm tabular-nums ${
                    item.time === "—" ? "text-gray-400" : "text-gray-900"
                  }`}
                >
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
