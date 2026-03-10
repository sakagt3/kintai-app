import { auth, isAdminUser } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ArrowLeft, History } from "lucide-react";
import { AdminUserTable } from "./AdminUserTable";
import { AdminDeletionLog } from "./AdminDeletionLog";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!isAdminUser(session)) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#1E293B] hover:underline dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <h1 className="flex items-center gap-3 text-xl font-bold text-[#1E293B] dark:text-slate-100">
            <Users className="h-7 w-7 text-[#1E293B] dark:text-slate-400" />
            ユーザー管理
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            権限の切り替え（Admin ↔ Member）・削除は各行のボタンから実行できます。本人も設定画面から自分のアカウントを削除できます。
          </p>
          <div className="mt-6">
            <AdminUserTable />
          </div>

          <h2 className="mt-10 flex items-center gap-2 text-lg font-semibold text-[#1E293B] dark:text-slate-200">
            <History className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            アカウント削除履歴
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            本人による削除・管理者による削除の履歴です。
          </p>
          <div className="mt-4">
            <AdminDeletionLog />
          </div>
        </div>
      </div>
    </div>
  );
}
