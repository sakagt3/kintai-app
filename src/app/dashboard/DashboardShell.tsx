"use client";

import { useState, useEffect } from "react";
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

const LG_PX = 1024;

function SidebarContent({
  pathname,
  isAdmin,
  onLinkClick,
}: {
  pathname: string;
  isAdmin: boolean;
  onLinkClick?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <Link href="/dashboard" className={navLinkClass(pathname === "/dashboard")} onClick={onLinkClick}>
          <LayoutDashboard className="h-5 w-5 shrink-0" /> ダッシュボード
        </Link>
        <Link href="/dashboard/history" className={navLinkClass(pathname === "/dashboard/history")} onClick={onLinkClick}>
          <History className="h-5 w-5 shrink-0" /> 打刻履歴
        </Link>
        <Link href="/dashboard/leave" className={navLinkClass(pathname === "/dashboard/leave")} onClick={onLinkClick}>
          <CalendarPlus className="h-5 w-5 shrink-0" /> 休暇申請
        </Link>
        <Link href="/dashboard/settings" className={navLinkClass(pathname === "/dashboard/settings")} onClick={onLinkClick}>
          <Settings className="h-5 w-5 shrink-0" /> 設定
        </Link>
        {isAdmin && (
          <Link href="/admin" className={navLinkClass(pathname.startsWith("/admin"))} onClick={onLinkClick}>
            <Shield className="h-5 w-5 shrink-0" /> 管理者
          </Link>
        )}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 touch-manipulation"
          onClick={() => {
            onLinkClick?.();
            signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="h-5 w-5 shrink-0" /> ログアウト
        </button>
      </div>
    </>
  );
}

function Sidebar({
  displayName,
  pathname,
  isAdmin,
}: {
  displayName: string;
  pathname: string;
  isAdmin: boolean;
}) {
  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-r border-slate-700/50 bg-[#1E293B] text-white"
      aria-label="メインメニュー"
    >
      <div className="flex items-center border-b border-white/10 px-4 py-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight truncate">Habit Logic</h1>
          <p className="mt-0.5 truncate text-xs text-white/70">{displayName}</p>
        </div>
      </div>
      <SidebarContent pathname={pathname} isAdmin={isAdmin} />
    </aside>
  );
}

export function DashboardShell({ displayName, isAdmin, children }: DashboardShellProps) {
  const pathname = usePathname() ?? "";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => {
      try {
        setIsMobile(window.innerWidth < LG_PX);
      } catch {
        setIsMobile(true);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="flex min-h-screen min-h-dvh bg-slate-100 dark:bg-[#0f172a]">
      {/* PCのみサイドバー表示 */}
      <div
        style={{ display: isMobile ? "none" : "block" }}
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:w-64"
      >
        <Sidebar displayName={displayName} pathname={pathname} isAdmin={isAdmin} />
      </div>

      {/* スマホのみヘッダー表示 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-[#0f172a]/95">
        <button
          type="button"
          aria-label="メニューを開く"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E293B] text-white"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-[#1E293B] dark:text-white">Habit Logic</h1>
      </header>

      {/* ドロワー */}
      {drawerOpen && (
        <>
          <button
            type="button"
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1E293B] text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <h2 className="font-bold text-white">Habit Logic</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              isAdmin={isAdmin}
              onLinkClick={() => setDrawerOpen(false)}
            />
          </aside>
        </>
      )}

      <main
        style={{
          marginLeft: isMobile ? 0 : "16rem",
          width: isMobile ? "100%" : "auto",
        }}
        className="flex-1 flex flex-col ml-0 lg:ml-64 pt-16 lg:pt-0"
      >
        <div className="flex flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
