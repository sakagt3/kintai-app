/** ダッシュボードページ: 本番でSSR/ハイドレーション起因のエラーを防ぐため dynamic(ssr:false) でクライアントのみ描画 */
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const DashboardWrapper = dynamic(
  () => import("./DashboardWrapper").then((m) => ({ default: m.DashboardWrapper })),
  { ssr: false, loading: () => (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1E293B] border-t-transparent" />
    </div>
  ) }
);

const Fallback = () => (
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

export default function DashboardPage() {
  return (
    <ErrorBoundary sectionName="ダッシュボード" fallback={<Fallback />}>
      <DashboardWrapper />
    </ErrorBoundary>
  );
}
