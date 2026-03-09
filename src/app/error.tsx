"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-8 w-8 shrink-0" />
          <h1 className="text-lg font-semibold text-[#1E293B] dark:text-slate-100">
            エラーが発生しました
          </h1>
        </div>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          申し訳ありません。問題が発生したため、再読み込みするかログイン画面へ戻ってください。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E293B] px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            再試行
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            ログインへ
          </Link>
        </div>
      </div>
    </div>
  );
}
