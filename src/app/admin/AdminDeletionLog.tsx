"use client";

import { useState, useEffect } from "react";
import { Loader2, History } from "lucide-react";

type DeletionLogRow = {
  id: string;
  deletedUserEmail: string;
  deletedUserName: string | null;
  deletedAt: string;
  deletedBy: string;
  deletedByUserId: string | null;
};

export function AdminDeletionLog() {
  const [logs, setLogs] = useState<DeletionLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/deletion-log")
      .then((res) => res.json())
      .then((data) => {
        if (data?.logs && Array.isArray(data.logs)) setLogs(data.logs);
        else setLogs([]);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        削除履歴はありません
      </p>
    );
  }

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return s;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
      <table className="w-full min-w-[400px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50">
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">削除日時</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">メール</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">名前</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">削除種別</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-slate-100 last:border-0 dark:border-slate-700"
            >
              <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 dark:text-slate-400">
                {formatDate(log.deletedAt)}
              </td>
              <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-200">
                {log.deletedUserEmail}
              </td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                {log.deletedUserName ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    log.deletedBy === "admin"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {log.deletedBy === "admin" ? "管理者による削除" : "本人による削除"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
