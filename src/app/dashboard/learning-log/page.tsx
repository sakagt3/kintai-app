import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LearningLogPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const userId = session.user.id;

  const bankRows = await prisma.questionBank.findMany({
    where: { userId },
    select: { id: true, question: true },
    orderBy: { createdAt: "asc" },
  });

  const questions = bankRows
    .map((row) => ({
      id: row.id,
      question: row.question,
    }))
    .filter((q) => q.id && q.question);

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { answeredAt: "desc" },
  });

  const questionTextById = new Map<string, string>();
  for (const q of questions) {
    questionTextById.set(q.id, q.question);
  }

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const lastAttemptByQuestion = new Map<string, (typeof attempts)[number]>();
  for (const a of attempts) {
    if (!lastAttemptByQuestion.has(a.questionId)) {
      lastAttemptByQuestion.set(a.questionId, a);
    }
  }

  const mastered = questions.filter((q) => {
    const last = lastAttemptByQuestion.get(q.id);
    if (!last || !last.nextReviewAt || !last.correct) return false;
    const diff = last.nextReviewAt.getTime() - now.getTime();
    return diff >= THIRTY_DAYS_MS;
  });

  return (
    <div className="flex min-h-screen flex-col gap-6 px-4 py-6 sm:px-6 md:px-8">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          学習ログ
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          出題履歴と、定着済みになった問題を確認できます。
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          出題履歴
        </h2>
        <div className="max-h-[360px] overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2">日付</th>
                <th className="px-3 py-2">問題</th>
                <th className="px-3 py-2">結果</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                  >
                    まだ学習履歴がありません。
                  </td>
                </tr>
              )}
              {attempts.map((a) => {
                const qText = questionTextById.get(a.questionId) ?? a.questionId;
                const d = a.answeredAt;
                const dateLabel = `${d.getFullYear()}-${String(
                  d.getMonth() + 1,
                ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(
                  d.getHours(),
                ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                return (
                  <tr
                    key={a.id}
                    className="border-t border-slate-100 last:border-b dark:border-slate-800"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-300">
                      {dateLabel}
                    </td>
                    <td className="max-w-md px-3 py-2 text-slate-800 dark:text-slate-100">
                      <span className="line-clamp-2 break-words">{qText}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          a.correct
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-100"
                        }`}
                      >
                        {a.correct ? "正解" : "不正解"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          定着済み問題
        </h2>
        {mastered.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            まだ定着済みと判定された問題はありません。学習を続けていきましょう。
          </p>
        ) : (
          <ul className="max-h-[260px] space-y-2 overflow-auto text-xs text-slate-800 dark:text-slate-100">
            {mastered.map((q) => (
              <li
                key={q.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60"
              >
                {q.question}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

