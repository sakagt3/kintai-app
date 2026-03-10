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
      {/* モバイル: ドロワー用オーバーレイ（lg未満のみ） */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="メニューを閉じる"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* サイドバー: スマホ・タブレットでは折りたたみドロワー（狭め）、PC(lg〜)で常時表示 */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] max-w-[78vw] border-r border-slate-700/50 bg-[#1E293B] text-white shadow-xl transition-transform duration-200 ease-out lg:translate-x-0 lg:w-56 lg:max-w-none lg:shadow-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-4 lg:px-4 lg:py-5">
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-bold tracking-tight truncate lg:text-lg">Habit Logic</h1>
              <p className="mt-0.5 truncate text-xs text-white/70">{displayName}</p>
            </div>
            <button
              type="button"
              aria-label="メニューを閉じる"
              className="lg:hidden shrink-0 rounded-lg p-2.5 hover:bg-white/10 touch-manipulation"
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
              className="flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 touch-manipulation"
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

      {/* メイン: スマホは全幅＋下ナビ、PC(lg〜)は ml-56 */}
      <main className="relative min-w-0 w-full flex-1 flex flex-col overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:ml-56 lg:pb-0">
        {/* スマホ・タブレット: 左上のメニューボタン（コンパクト） */}
        <button
          type="button"
          aria-label="メニューを開く"
          className="fixed top-3 left-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E293B] text-white shadow-lg touch-manipulation lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* コンテンツ: スマホでメニューボタンと下ナビの余白を確保 */}
        <div className="flex min-w-0 flex-1 flex-col pt-12 lg:pt-0">
          {children}
        </div>
      </main>

      {/* スマホ・タブレット: 下部固定ナビ（メニュー枠を取らない） */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200/80 bg-white/95 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:hidden dark:border-slate-700 dark:bg-[#0f172a]/95"
        aria-label="メインメニュー"
      >
        <Link
          href="/dashboard"
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 touch-manipulation ${
            pathname === "/dashboard"
              ? "text-[#1E293B] dark:text-white"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium">ホーム</span>
        </Link>
        <Link
          href="/dashboard/history"
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 touch-manipulation ${
            pathname === "/dashboard/history"
              ? "text-[#1E293B] dark:text-white"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <History className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium">履歴</span>
        </Link>
        <Link
          href="/dashboard/leave"
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 touch-manipulation ${
            pathname === "/dashboard/leave"
              ? "text-[#1E293B] dark:text-white"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <CalendarPlus className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium">休暇</span>
        </Link>
        <Link
          href="/dashboard/settings"
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 touch-manipulation ${
            pathname === "/dashboard/settings"
              ? "text-[#1E293B] dark:text-white"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium">設定</span>
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 touch-manipulation ${
              pathname.startsWith("/admin")
                ? "text-[#1E293B] dark:text-white"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Shield className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium">管理</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
