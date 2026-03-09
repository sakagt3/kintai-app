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
        toast.error(data?.error ?? "登録に失敗しました。");
        setFieldErrors({ email: data?.error ?? "" });
        return;
      }
      toast.success("登録が完了しました。");
      const email = parsed.data.email.trim().toLowerCase();
      const password = parsed.data.password;
      try {
        const signInResult = await Promise.race([
          signIn("credentials", { email, password, redirect: false }),
          new Promise<undefined>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          ),
        ]);
        if (signInResult && !(signInResult as { error?: string }).error) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
      } catch {
        // signIn がタイムアウトまたは失敗 → ログイン画面へ
      }
      toast.info("ログイン画面から、今のメールとパスワードでサインインしてください。");
      router.push("/?registered=1");
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
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Habit Logic</h1>
          <p className="mt-2 text-sm text-slate-600">
            習慣を、上昇のロジックに変える。
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">新規登録</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                名前
              </label>
              <input
                id="name"
                type="text"
                placeholder="山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white text-slate-800"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white text-slate-800"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "登録中..." : "登録"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            すでにアカウントをお持ちの方は
            <Link href="/" className="text-blue-600 hover:underline ml-1 font-medium">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
