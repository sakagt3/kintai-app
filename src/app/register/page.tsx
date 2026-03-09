"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { registerSchema } from "@/lib/validations";

/**
 * 新規登録画面: バリデーション後APIで登録し、成功時は即ログインしてダッシュボードへ
 */
export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      name: name.trim() || undefined,
      email: email.trim(),
      password,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        const path = err.path[0];
        if (path && typeof path === "string") errors[path] = err.message;
      });
      setFieldErrors(errors);
      toast.error("入力内容を確認してください。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email.trim().toLowerCase(),
          password: parsed.data.password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? "登録に失敗しました。");
        setFieldErrors({ email: data.error });
        return;
      }
      toast.success("登録が完了しました。");
      const signInResult = await signIn("credentials", {
        email: parsed.data.email.trim().toLowerCase(),
        password: parsed.data.password,
        redirect: false,
      });
      if (signInResult?.error) {
        toast.info("登録しました。ログイン画面からお入りください。");
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      toast.error(
        "通信エラーが発生しました。しばらく経ってからお試しください。",
      );
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
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_4px_24px_rgba(30,41,59,0.08)] dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
          <h2 className="text-lg font-semibold text-[#1E293B] dark:text-white mb-6">
            新規登録
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300"
              >
                名前
              </label>
              <input
                id="name"
                type="text"
                placeholder="山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E293B]/20 focus:border-[#1E293B] dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-500/30"
              />
            </div>
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E293B]/20 focus:border-[#1E293B] dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-500/30"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.email}
                </p>
              )}
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
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E293B]/20 focus:border-[#1E293B] dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-slate-500/30"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#1E293B] text-white font-semibold rounded-lg hover:bg-[#334155] focus:outline-none focus:ring-2 focus:ring-[#1E293B]/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              {loading ? "登録中..." : "登録"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            すでにアカウントをお持ちの方は
            <Link
              href="/login"
              className="text-[#1E293B] hover:underline ml-1 font-medium dark:text-slate-300 dark:hover:text-white"
            >
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
