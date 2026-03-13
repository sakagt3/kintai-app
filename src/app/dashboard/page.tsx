/** ダッシュボードページ: 本番でSSR/ハイドレーション起因のエラーを防ぐため dynamic(ssr:false) でクライアントのみ描画 */
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardFallback } from "./DashboardFallback";

const DashboardWrapper = dynamic(
  () => import("./DashboardWrapper").then((m) => ({ default: m.DashboardWrapper })),
  { ssr: false, loading: () => (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1E293B] border-t-transparent" />
    </div>
  ) }
);

export default function DashboardPage() {
  return (
    <ErrorBoundary sectionName="ダッシュボード" fallback={<DashboardFallback />}>
      <DashboardWrapper />
    </ErrorBoundary>
  );
}
// DEBUG REMOVE LATER
