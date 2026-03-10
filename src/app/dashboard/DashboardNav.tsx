"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  CalendarPlus,
  Settings,
  Shield,
} from "lucide-react";

const linkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
    active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/10"
  }`;

export function DashboardNav({
  isAdmin,
}: {
  displayName: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname() ?? "";

  return (
    <>
      <Link href="/dashboard" className={linkClass(pathname === "/dashboard")}>
        <LayoutDashboard className="h-5 w-5" />
        ダッシュボード
      </Link>
      <Link href="/dashboard/history" className={linkClass(pathname === "/dashboard/history")}>
        <History className="h-5 w-5" />
        打刻履歴
      </Link>
      <Link href="/dashboard/leave" className={linkClass(pathname === "/dashboard/leave")}>
        <CalendarPlus className="h-5 w-5" />
        休暇申請
      </Link>
      <Link href="/dashboard/settings" className={linkClass(pathname === "/dashboard/settings")}>
        <Settings className="h-5 w-5" />
        設定
      </Link>
      {isAdmin && (
        <Link href="/admin" className={linkClass(pathname.startsWith("/admin"))}>
          <Shield className="h-5 w-5" />
          管理者
        </Link>
      )}
    </>
  );
}
