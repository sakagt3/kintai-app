import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Users, ArrowLeft } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session?.user?.role !== "admin") redirect("/dashboard");

  let userCount = 0;
  try {
    userCount = await prisma.user.count();
  } catch {
    userCount = -1;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#1E293B] hover:underline dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          ダッシュボードに戻る
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="flex items-center gap-3 text-xl font-bold text-[#1E293B] dark:text-slate-100">
            <Users className="h-7 w-7 text-[#1E293B] dark:text-slate-400" />
            管理者用
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            登録ユーザー数の確認
          </p>
          <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/80 p-6 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              登録ユーザー数
            </p>
            <p className="mt-2 text-3xl font-bold text-[#1E293B] dark:text-slate-100">
              {userCount >= 0 ? userCount : "—"}
            </p>
            {userCount < 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                取得に失敗しました
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
