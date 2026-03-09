"use client";

/**
 * 設定画面: 表示カスタマイズ・表示ボリューム・トピック選択・学習目標・クイズ出題数・プロフィールをDBに保存。
 * プラン適用（即時反映）・1分クイック診断・トピック vs 問題形式のトグル対応。
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { TOPICS } from "@/lib/topics";
import { PlanPreview } from "./PlanPreview";
import { QuickDiagnosis } from "./QuickDiagnosis";

type DisplayMode = "standard" | "detail_special" | "detail_news";
type DisplayVolume = "simple" | "detailed";
type LearningLevel = "beginner" | "intermediate" | "advanced" | "pro";
type ContentFocus = "topic" | "quiz";

type SettingsState = {
  showSpecialDay: boolean;
  showAiNews: boolean;
  showAiTerm: boolean;
  displayMode: DisplayMode;
  displayVolume: DisplayVolume;
  preferredTopicIds: string[];
  customLearningGoal: string;
  dailyQuizCount: number;
  learningLevel: LearningLevel;
  contentFocus: ContentFocus;
  appliedPlanSummary: string;
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
    showAiTerm: true,
    displayMode: "standard",
    displayVolume: "simple",
    preferredTopicIds: [],
    customLearningGoal: "",
    dailyQuizCount: 5,
    learningLevel: "intermediate",
    contentFocus: "topic",
    appliedPlanSummary: "",
  });
  const [profile, setProfile] = useState<ProfileState>({ name: "", email: "" });
  const [diagnosisPreviewText, setDiagnosisPreviewText] = useState("");
  const [showQuickDiagnosis, setShowQuickDiagnosis] = useState(false);
  const [masterPlanLoading, setMasterPlanLoading] = useState(false);
  const router = useRouter();

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
            showAiTerm: data.settings.showAiTerm ?? true,
            displayMode: data.settings.displayMode ?? "standard",
            displayVolume: data.settings.displayVolume === "detailed" ? "detailed" : "simple",
            preferredTopicIds: Array.isArray(data.settings.preferredTopicIds)
              ? data.settings.preferredTopicIds
              : [],
            customLearningGoal: data.settings.customLearningGoal ?? "",
            dailyQuizCount:
              typeof data.settings.dailyQuizCount === "number"
                ? Math.min(20, Math.max(1, data.settings.dailyQuizCount))
                : 5,
            learningLevel:
              ["beginner", "intermediate", "advanced", "pro"].includes(
                data.settings.learningLevel
              )
                ? data.settings.learningLevel
                : "intermediate",
            contentFocus:
              data.settings.contentFocus === "quiz" ? "quiz" : "topic",
            appliedPlanSummary: data.settings.appliedPlanSummary ?? "",
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
        showAiTerm: settings.showAiTerm,
        displayMode: settings.displayMode,
        displayVolume: settings.displayVolume,
        preferredTopicIds: settings.preferredTopicIds,
        customLearningGoal: settings.customLearningGoal || undefined,
        dailyQuizCount: settings.dailyQuizCount,
        learningLevel: settings.learningLevel,
        contentFocus: settings.contentFocus,
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

  const handleApply = async (planText: string) => {
    const summary =
      planText.slice(0, 2000) + (planText.length > 2000 ? "…" : "");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customLearningGoal: settings.customLearningGoal || undefined,
        learningLevel: settings.learningLevel,
        preferredTopicIds: settings.preferredTopicIds,
        contentFocus: settings.contentFocus,
        appliedPlanSummary: summary,
      }),
    });
    if (!res.ok) throw new Error("設定の保存に失敗しました。");
    await fetch("/api/learning-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "plan_apply",
        payload: {
          goal: settings.customLearningGoal,
          level: settings.learningLevel,
          topics: settings.preferredTopicIds,
          contentFocus: settings.contentFocus,
          planSummary: summary,
        },
      }),
    });
    toast.success("プランを適用しました。メイン画面に反映されます。");
    router.push("/dashboard");
    router.refresh();
  };

  const handlePlanCreate = async () => {
    setMasterPlanLoading(true);
    setDiagnosisPreviewText("");
    try {
      const res = await fetch("/api/ai/plan-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: settings.customLearningGoal,
          level: settings.learningLevel,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      const planText = data.planText ?? "";
      setDiagnosisPreviewText(planText);
      toast.success("プランを作成しました。下の「このプランを適用して開始する」で確定できます。");
    } catch {
      toast.error("プランの生成に失敗しました。");
    } finally {
      setMasterPlanLoading(false);
    }
  };

  const handleDiagnosisResult = (
    level: "beginner" | "intermediate" | "advanced" | "pro",
    message: string
  ) => {
    setSettings((s) => ({ ...s, learningLevel: level }));
    setDiagnosisPreviewText(message);
    fetch("/api/learning-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "diagnosis",
        payload: { level, message },
      }),
    }).catch(() => {});
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
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm text-gray-700">AI用語（営業向け）を表示する</span>
            <input
              type="checkbox"
              checked={settings.showAiTerm}
              onChange={(e) =>
                setSettings((s) => ({ ...s, showAiTerm: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
            />
          </label>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="mb-2 text-xs font-medium text-gray-600">表示ボリューム</p>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="displayVolume"
                checked={settings.displayVolume === "simple"}
                onChange={() =>
                  setSettings((s) => ({ ...s, displayVolume: "simple" }))
                }
                className="h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
              />
              <span className="text-sm">簡易</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="displayVolume"
                checked={settings.displayVolume === "detailed"}
                onChange={() =>
                  setSettings((s) => ({ ...s, displayVolume: "detailed" }))
                }
                className="h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
              />
              <span className="text-sm">詳細</span>
            </label>
          </div>
        </div>
      </section>

      {/* 忘却曲線キャッチコピー */}
      <section className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 to-orange-50/60 p-6">
        <p className="text-center text-sm font-semibold tracking-wide text-amber-900/90">
          科学的根拠に基づいた忘却曲線アルゴリズムが、
          <br />
          あなたの定着度を最大化します
        </p>
      </section>

      {/* トピック選択・学習目標（LLM連携基盤） */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          興味トピック・学習目標（パーソナライズ）
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          興味のあるジャンルを選ぶと、コンテンツの優先度に反映されます。自由記述で「何を学びたいか」を入力すると、AIがその要望に沿ったプランを生成します。
        </p>

        {/* 4段階レベル */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-gray-600">
            レベル（解説の深さ・専門用語の量）
          </label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "beginner", label: "初心者" },
                { id: "intermediate", label: "中級者" },
                { id: "advanced", label: "上級者" },
                { id: "pro", label: "プロ" },
              ] as const
            ).map(({ id, label }) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm hover:bg-gray-100"
              >
                <input
                  type="radio"
                  name="learningLevel"
                  checked={settings.learningLevel === id}
                  onChange={() =>
                    setSettings((s) => ({ ...s, learningLevel: id }))
                  }
                  className="h-3.5 w-3.5 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <label
              key={t.id}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={settings.preferredTopicIds.includes(t.id)}
                onChange={(e) => {
                  setSettings((s) => ({
                    ...s,
                    preferredTopicIds: e.target.checked
                      ? [...s.preferredTopicIds, t.id]
                      : s.preferredTopicIds.filter((id) => id !== t.id),
                  }));
                }}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
              />
              {t.label}
            </label>
          ))}
        </div>
        {/* トピック中心 vs 問題形式 */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-gray-600">
            コンテンツの重心
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="contentFocus"
                checked={settings.contentFocus === "topic"}
                onChange={() =>
                  setSettings((s) => ({ ...s, contentFocus: "topic" }))
                }
                className="h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
              />
              <span className="text-sm">トピック中心（解説重視）</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="contentFocus"
                checked={settings.contentFocus === "quiz"}
                onChange={() =>
                  setSettings((s) => ({ ...s, contentFocus: "quiz" }))
                }
                className="h-4 w-4 border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
              />
              <span className="text-sm">問題形式（クイズ重視）</span>
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            自由記述で学びたいこと（例: TOEIC 800点を目指すための単語）
          </label>
          <div className="flex flex-wrap items-start gap-2">
            <textarea
              value={settings.customLearningGoal}
              onChange={(e) =>
                setSettings((s) => ({ ...s, customLearningGoal: e.target.value }))
              }
              placeholder="例: TOEIC 800点を目指すための単語"
              rows={2}
              className="w-full max-w-lg rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
            />
            <div className="flex shrink-0 flex-col gap-2">
              <button
                type="button"
                onClick={handlePlanCreate}
                disabled={masterPlanLoading}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {masterPlanLoading ? "生成中…" : "この内容でプラン作成"}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickDiagnosis(true)}
                className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700"
              >
                AIにレベルを判定してもらう
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            プラン作成後、下のプレビューで「このプランを適用して開始する」を押すと、ダッシュボードで毎日その方針に沿った問題が表示されます。
          </p>
        </div>

        {showQuickDiagnosis && (
          <div className="mt-4">
            <QuickDiagnosis
              triggerLabel="AIにレベルを判定してもらう"
              onResult={handleDiagnosisResult}
            />
          </div>
        )}

        {/* インタラクティブ・プランプレビュー */}
        <div className="mt-4">
          <PlanPreview
            goal={settings.customLearningGoal}
            level={settings.learningLevel}
            contentFocus={settings.contentFocus}
            appliedPlanSummary={settings.appliedPlanSummary}
            previewOverrideText={diagnosisPreviewText}
            planLoading={masterPlanLoading}
            onApply={handleApply}
          />
        </div>
      </section>

      {/* クイズ出題数 */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          1日のクイズ出題数
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          忘却曲線に基づく復習問題を優先し、残りをランダムで出題します。
        </p>
        <select
          value={settings.dailyQuizCount}
          onChange={(e) =>
            setSettings((s) => ({
              ...s,
              dailyQuizCount: Number(e.target.value),
            }))
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
        >
          {[5, 10, 15, 20].map((n) => (
            <option key={n} value={n}>
              {n}問
            </option>
          ))}
        </select>
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
