"use client";

import { useState, useEffect } from "react";
import { Shield, User, Loader2, Trash2 } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

export function AdminUserTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.users)) setUsers(data.users);
      else setUsers([]);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (user: UserRow) => {
    const nextRole = user.role === "admin" ? "member" : "admin";
    setUpdatingId(user.id);
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (user: UserRow) => {
    if (!confirm(`「${user.email}」を削除しますか？\n関連する勤怠・設定データもすべて削除されます。`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } else {
        alert(data?.error ?? "削除に失敗しました");
      }
    } catch {
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        ユーザーがありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50">
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">メール</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">名前</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">権限</th>
            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-slate-100 last:border-0 dark:border-slate-700"
            >
              <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-200">
                {user.email}
              </td>
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                {user.name ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {user.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  {user.role === "admin" ? "Admin" : "Member"}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRole(user)}
                    disabled={updatingId === user.id || deletingId === user.id}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {updatingId === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : user.role === "admin" ? (
                      "Member に変更"
                    ) : (
                      "Admin に変更"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteUser(user)}
                    disabled={deletingId === user.id || updatingId === user.id}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950"
                    title="アカウントを削除"
                  >
                    {deletingId === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                        削除
                      </>
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
