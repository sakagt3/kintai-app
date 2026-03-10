"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  History,
  CalendarPlus,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navLinkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium min-h-[44px] ${
    active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/10"
  }`;

type DashboardShellProps = {
  displayName: string;
  isAdmin: boolean;
  children: React.ReactNode;
};

export function DashboardShell({
  displayName,
  isAdmin,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname() ?? "";

  return (
    <div className="flex min-h-screen min-h-dvh bg-slate-100 dark:bg-[#0f172a]">
      {/* モバイル: オーバーレイ */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* サイドバー: モバイルではドロワー、md以上で常時表示 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 max-w-[85vw] border-r border-slate-700/50 bg-[#1E293B] text-white transition-transform duration-200 ease-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight truncate">Habit Logic</h1>
              <p className="mt-1 truncate text-xs text-white/70">{displayName}</p>
            </div>
            <button
              type="button"
              aria-label="メニューを閉じる"
              className="md:hidden shrink-0 rounded-lg p-2 hover:bg-white/10"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            <Link
              href="/dashboard"
              className={navLinkClass(pathname === "/dashboard")}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              ダッシュボード
            </Link>
            <Link
              href="/dashboard/history"
              className={navLinkClass(pathname === "/dashboard/history")}
              onClick={() => setMobileMenuOpen(false)}
            >
              <History className="h-5 w-5 shrink-0" />
              打刻履歴
            </Link>
            <Link
              href="/dashboard/leave"
              className={navLinkClass(pathname === "/dashboard/leave")}
              onClick={() => setMobileMenuOpen(false)}
            >
              <CalendarPlus className="h-5 w-5 shrink-0" />
              休暇申請
            </Link>
            <Link
              href="/dashboard/settings"
              className={navLinkClass(pathname === "/dashboard/settings")}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-5 w-5 shrink-0" />
              設定
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={navLinkClass(pathname.startsWith("/admin"))}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="h-5 w-5 shrink-0" />
                管理者
              </Link>
            )}
          </nav>
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              className="flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
              onClick={() => {
                setMobileMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              ログアウト
            </button>
          </div>
        </div>
      </aside>

      {/* メイン: モバイルは全幅、md以上は ml-56 */}
      <main className="relative min-w-0 w-full flex-1 flex flex-col md:ml-56 overflow-x-hidden">
        {/* モバイル: ハンバーガーボタン */}
        <button
          type="button"
          aria-label="メニューを開く"
          className="fixed top-4 left-4 z-30 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1E293B] text-white shadow-lg md:hidden touch-manipulation"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* コンテンツ: モバイルでハンバーガー分の余白 */}
        <div className="flex min-w-0 flex-1 flex-col pt-14 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
