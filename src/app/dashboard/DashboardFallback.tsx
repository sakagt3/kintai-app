"use client";

/** ダッシュボード ErrorBoundary 用のフォールバック（onClick を使うためクライアントコンポーネント） */
export function DashboardFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm text-slate-600 dark:text-slate-400">表示中に問題が発生しました。</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-[#1E293B] px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        再読み込み
      </button>
    </div>
  );
}
