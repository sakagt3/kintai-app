"use client";

/**
 * 設定画面: 表示カスタマイズ（今日は何の日・AIニュースON/OFF）、
 * 表示モード選択、プロフィール（名前・メール確認・名前変更）をDBに保存する。
 */
import { useEffect, useState } from "react";
import { Settings, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type DisplayMode = "standard" | "detail_special" | "detail_news";

type SettingsState = {
  showSpecialDay: boolean;
  showAiNews: boolean;
  displayMode: DisplayMode;
};

type ProfileState = {
  name: string;
  email: string;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    showSpecialDay: true,
    showAiNews: true,
    displayMode: "standard",
  });
  const [profile, setProfile] = useState<ProfileState>({ name: "", email: "" });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => {
        if (!res.ok) throw new Error("設定の取得に失敗しました。");
        return res.json();
      })
      .then((data) => {
        if (data.settings) {
          setSettings({
            showSpecialDay: data.settings.showSpecialDay ?? true,
            showAiNews: data.settings.showAiNews ?? true,
            displayMode: data.settings.displayMode ?? "standard",
          });
        }
        if (data.profile) {
          setProfile({
            name: data.profile.name ?? "",
            email: data.profile.email ?? "",
          });
        }
      })
      .catch(() => toast.error("設定の取得に失敗しました。"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showSpecialDay: settings.showSpecialDay,
        showAiNews: settings.showAiNews,
        displayMode: settings.displayMode,
        name: profile.name,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("保存に失敗しました。");
        toast.success("設定を保存しました。");
      })
      .catch(() => toast.error("設定の保存に失敗しました。"))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1e3a5f] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <Settings className="h-5 w-5 text-[#1e3a5f]" />
          設定
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          保存
        </button>
      </div>

      {/* 表示カスタマイズ */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          表示カスタマイズ
        </h2>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm text-gray-700">
              今日は何の日を表示する
            </span>
            <input
              type="checkbox"
              checked={settings.showSpecialDay}
              onChange={(e) =>
                setSettings((s) => ({ ...s, showSpecialDay: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm text-gray-700">AIニュースを表示する</span>
            <input
              type="checkbox"
              checked={settings.showAiNews}
              onChange={(e) =>
                setSettings((s) => ({ ...s, showAiNews: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
          </label>
        </div>
      </section>

      {/* 表示モード */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          表示モード
        </h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="displayMode"
              value="standard"
              checked={settings.displayMode === "standard"}
              onChange={() =>
                setSettings((s) => ({ ...s, displayMode: "standard" }))
              }
              className="mt-1 h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">
                標準表示
              </span>
              <p className="text-xs text-gray-500">
                「今日は何の日」と「AIニュース」を両方表示します。
              </p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="displayMode"
              value="detail_special"
              checked={settings.displayMode === "detail_special"}
              onChange={() =>
                setSettings((s) => ({ ...s, displayMode: "detail_special" }))
              }
              className="mt-1 h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">
                詳細解説モード（今日は何の日）
              </span>
              <p className="text-xs text-gray-500">
                「今日は何の日」を詳しく表示し、AIニュースは簡略表示します。
              </p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="displayMode"
              value="detail_news"
              checked={settings.displayMode === "detail_news"}
              onChange={() =>
                setSettings((s) => ({ ...s, displayMode: "detail_news" }))
              }
              className="mt-1 h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
            <div>
              <span className="text-sm font-medium text-gray-800">
                詳細解説モード（AIニュース）
              </span>
              <p className="text-xs text-gray-500">
                AIニュースを詳しく表示し、「今日は何の日」は簡略表示します。
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ユーザープロフィール */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          プロフィール
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              表示名
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="名前を入力"
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              メールアドレス（確認用・変更はできません）
            </label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {profile.email}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
