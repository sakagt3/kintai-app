import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

/** useSearchParams を使う LoginForm を Suspense でラップ（ビルド時の prerender エラー回避） */
function LoginFallback() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
