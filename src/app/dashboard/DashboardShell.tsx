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

/** サイドバー内のナビ＋ログアウト（PC用とモバイルドロワー用で共通） */
function SidebarNav({
  pathname,
  isAdmin,
  onNavClick,
}: {
  pathname: string;
  isAdmin: boolean;
  onNavClick?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <Link
          href="/dashboard"
          className={navLinkClass(pathname === "/dashboard")}
          onClick={onNavClick}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          ダッシュボード
        </Link>
        <Link
          href="/dashboard/history"
          className={navLinkClass(pathname === "/dashboard/history")}
          onClick={onNavClick}
        >
          <History className="h-5 w-5 shrink-0" />
          打刻履歴
        </Link>
        <Link
          href="/dashboard/leave"
          className={navLinkClass(pathname === "/dashboard/leave")}
          onClick={onNavClick}
        >
          <CalendarPlus className="h-5 w-5 shrink-0" />
          休暇申請
        </Link>
        <Link
          href="/dashboard/settings"
          className={navLinkClass(pathname === "/dashboard/settings")}
          onClick={onNavClick}
        >
          <Settings className="h-5 w-5 shrink-0" />
          設定
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className={navLinkClass(pathname.startsWith("/admin"))}
            onClick={onNavClick}
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
            onNavClick?.();
            signOut({ callbackUrl: "/" });
          }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          ログアウト
        </button>
      </div>
    </>
  );
}

/** 1024px 以上を PC とみなす（Tailwind lg と一致） */
const DESKTOP_BREAKPOINT_PX = 1024;

/**
 * モバイルでサイドバーが消えない原因と対策:
 * - 原因: Safari（特に iOS）で Tailwind の hidden + lg:flex の組み合わせが
 *   メディアクエリとして正しく解釈されず、サイドバーが表示され続けることがある。
 *   またキャッシュで古い CSS が効いている可能性もある。
 * - 対策: CSS のメディアクエリに頼らず、window.matchMedia で 1024px 未満のときは
 *   PC 用サイドバーを DOM に一切出さない。モバイル用ヘッダー・下ナビ・ドロワーも
 *   isDesktop が false のときだけ描画する。
 */
export function DashboardShell({
  displayName,
  isAdmin,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const m = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`);
    const update = () => setIsDesktop(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex min-h-screen min-h-dvh bg-slate-100 dark:bg-[#0f172a]">
      {/* サイドバー: スマホでは .force-hidden-mobile で display:none !important、PC で表示 */}
      <div className="force-hidden-mobile flex h-full w-56 shrink-0 flex-col">
        <aside
          className="flex h-full w-full flex-col border-r border-slate-700/50 bg-[#1E293B] text-white"
          aria-label="メインメニュー"
        >
          <div className="flex items-center border-b border-white/10 px-4 py-5">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold tracking-tight truncate">Habit Logic</h1>
              <p className="mt-0.5 truncate text-xs text-white/70">{displayName}</p>
            </div>
          </div>
          <SidebarNav pathname={pathname} isAdmin={isAdmin} />
        </aside>
      </div>

      {/* メイン: スマホは ml-0 で余白なし、PCはサイドバー隣 */}
      <main className={`relative min-w-0 flex-1 flex flex-col overflow-x-hidden ml-0 ${isDesktop ? "pb-0" : "pb-[calc(5rem+env(safe-area-inset-bottom,0px))]"}`}>
        {/* モバイル専用: 上部固定ヘッダー（ハンバーガー）。isDesktop 時は描画しない */}
        {!isDesktop && (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-[#0f172a]/95">
          <button
            type="button"
            aria-label="メニューを開く"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E293B] text-white touch-manipulation hover:bg-[#334155]"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 truncate text-base font-bold tracking-tight text-[#1E293B] dark:text-white">
            Habit Logic
          </h1>
        </header>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {children}
        </div>
      </main>

      {/* モバイルのみ: ドロワー（オーバーレイ＋左からスライド）。isDesktop のときは出さない */}
      {!isDesktop && mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="メニューを閉じる"
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeMenu}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-slate-700/50 bg-[#1E293B] text-white shadow-xl transition-transform duration-200 ease-out"
            aria-label="メニュー"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold tracking-tight truncate">Habit Logic</h2>
                <p className="mt-0.5 truncate text-xs text-white/70">{displayName}</p>
              </div>
              <button
                type="button"
                aria-label="メニューを閉じる"
                className="shrink-0 rounded-lg p-2.5 hover:bg-white/10 touch-manipulation"
                onClick={closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} isAdmin={isAdmin} onNavClick={closeMenu} />
          </aside>
        </>
      )}

      {/* モバイル: 下部固定ナビ。isDesktop のときは描画しない */}
      {!isDesktop && (
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200/80 bg-white/95 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm dark:border-slate-700 dark:bg-[#0f172a]/95"
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
      )}
    </div>
  );
}
