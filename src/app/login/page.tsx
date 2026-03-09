"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        const msg = "メールアドレスまたはパスワードが正しくありません。";
        setError(msg);
        toast.error(msg);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      const msg =
        "通信エラーが発生しました。しばらく経ってからお試しください。";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-12 dark:from-[#0f172a] dark:to-[#1e293b]">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#1E293B] dark:text-white">
            Habit Logic
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            習慣を、上昇のロジックに変える。
            <br />
            <span className="text-xs text-slate-500 dark:text-slate-500">
              Transforming Habits into Logic for Growth
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_24px_rgba(30,41,59,0.08)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E293B]/20 focus:border-[#1E293B] dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-500/30"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E293B]/20 focus:border-[#1E293B] dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-500/30"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1E293B] text-white font-semibold rounded-lg hover:bg-[#334155] focus:outline-none focus:ring-2 focus:ring-[#1E293B]/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            アカウントをお持ちでない方は
            <Link
              href="/register"
              className="text-[#1E293B] hover:underline ml-1 font-medium dark:text-slate-300 dark:hover:text-white"
            >
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
