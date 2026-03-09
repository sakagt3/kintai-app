"use client";

import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardContent } from "./DashboardContent";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

const fallback = (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
    <p className="text-sm text-slate-600 dark:text-slate-400">
      ダッシュボードの読み込み中に問題が発生しました。
    </p>
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 rounded-lg bg-[#1E293B] px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700"
      >
        <RefreshCw className="h-4 w-4" />
        再読み込み
      </button>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        ダッシュボードへ
      </Link>
    </div>
  </div>
);

/** クライアントマウント後にのみダッシュボードを描画し、SSR/ハイドレーション時のエラーを防ぐ */
export function DashboardWrapper() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1E293B] border-t-transparent" />
      </div>
    );
  }

  return (
    <ErrorBoundary sectionName="ダッシュボード" fallback={fallback}>
      <DashboardContent />
    </ErrorBoundary>
  );
}
