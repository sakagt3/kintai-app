import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  History,
  CalendarPlus,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

/** auth() が headers を使うため静的生成を無効化 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("[DashboardLayout] auth() failed:", e);
    redirect("/");
  }
  if (!session) redirect("/");

  const userName = (session?.user && typeof session.user === "object" && ("name" in session.user ? session.user.name : "email" in session.user ? session.user.email : null)) ?? "—";
  const displayName = typeof userName === "string" ? userName : "—";
  const isAdmin = (session?.user && typeof session.user === "object" && "role" in session.user && session.user.role === "admin") ?? false;

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0f172a]">
      <aside className="fixed inset-y-0 left-0 z-30 w-56 border-r border-slate-700/50 bg-[#1E293B] text-white">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-4 py-5">
            <h1 className="text-lg font-bold tracking-tight">Habit Logic</h1>
            <p className="mt-1 truncate text-xs text-white/70">
              {displayName}
            </p>
          </div>
          <nav className="flex-1 space-y-0.5 p-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-white/10"
            >
              <LayoutDashboard className="h-5 w-5" />
              ダッシュボード
            </Link>
            <Link
              href="/dashboard#history"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              <History className="h-5 w-5" />
              打刻履歴
            </Link>
            <Link
              href="/dashboard/leave"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              <CalendarPlus className="h-5 w-5" />
              休暇申請
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              <Settings className="h-5 w-5" />
              設定
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                <Shield className="h-5 w-5" />
                管理者
              </Link>
            )}
          </nav>
          <div className="border-t border-white/10 p-3">
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/auth");
                await signOut();
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="ml-56 flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
