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
  showAppliedPlan: boolean;
  displayMode: DisplayMode;
  displayVolume: DisplayVolume;
  preferredTopicIds: string[];
  customLearningGoal: string;
  customQuizName: string;
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
    showAppliedPlan: true,
    displayMode: "standard",
    displayVolume: "simple",
    preferredTopicIds: [],
    customLearningGoal: "",
    customQuizName: "",
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
        const s = data?.settings;
        if (s) {
          setSettings({
            showSpecialDay: s.showSpecialDay ?? true,
            showAiNews: s.showAiNews ?? true,
            showAiTerm: s.showAiTerm ?? true,
            showAppliedPlan: s.showAppliedPlan ?? true,
            displayMode: s.displayMode ?? "standard",
            displayVolume: s.displayVolume === "detailed" ? "detailed" : "simple",
            preferredTopicIds: Array.isArray(s.preferredTopicIds) ? s.preferredTopicIds : [],
            customLearningGoal: s.customLearningGoal ?? "",
            customQuizName: s.customQuizName ?? "",
            dailyQuizCount:
              typeof s.dailyQuizCount === "number"
                ? Math.min(20, Math.max(1, s.dailyQuizCount))
                : 5,
            learningLevel:
              ["beginner", "intermediate", "advanced", "pro"].includes(s.learningLevel ?? "")
                ? (s.learningLevel ?? "intermediate")
                : "intermediate",
            contentFocus: s.contentFocus === "quiz" ? "quiz" : "topic",
            appliedPlanSummary: s.appliedPlanSummary ?? "",
          });
        }
        const p = data?.profile;
        if (p) {
          setProfile({
            name: p.name ?? "",
            email: p.email ?? "",
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
        showAppliedPlan: settings.showAppliedPlan,
        displayMode: settings.displayMode,
        displayVolume: settings.displayVolume,
        preferredTopicIds: settings.preferredTopicIds,
        customLearningGoal: settings.customLearningGoal || undefined,
        customQuizName: settings.customQuizName.trim() || undefined,
        dailyQuizCount: settings.dailyQuizCount,
        learningLevel: settings.learningLevel,
        contentFocus: settings.contentFocus,
        name: profile.name,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "保存に失敗しました。");
        toast.success("設定を保存し、ダッシュボードを更新しました");
        router.refresh();
      })
      .catch((err: Error) => toast.error(err.message ?? "設定の保存に失敗しました。"))
      .finally(() => setSaving(false));
  };

  const handleApply = async (planText: string) => {
    const summary =
      planText.slice(0, 2000) + (planText.length > 2000 ? "…" : "");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customLearningGoal: settings.customLearningGoal || undefined,
          learningLevel: settings.learningLevel,
          preferredTopicIds: settings.preferredTopicIds,
          contentFocus: settings.contentFocus,
          appliedPlanSummary: summary,
          customQuizName: settings.customQuizName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "設定の保存に失敗しました。");
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
      toast.success("設定を保存し、ダッシュボードに反映しました！");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "設定の保存に失敗しました。");
    }
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
      if (!res.ok) throw new Error(data?.error ?? "生成に失敗しました");
      const planText = data?.planText ?? "";
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

      {/* 表示カスタマイズ：4つのトグル */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          表示カスタマイズ
        </h2>
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span className="text-sm text-gray-700">今日は何の日を表示</span>
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
            <span className="text-sm text-gray-700">AIニュースを表示</span>
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
            <span className="text-sm text-gray-700">AI用語学習を表示</span>
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

      <p className="text-center text-xs text-gray-500">
        科学的アルゴリズムがあなたの定着度を最適化します。
      </p>

      {/* 自分だけのプラン表示トグル ＋ プラン選択（A. 選択式 / B. 生成AI式） */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-gray-800">
          学習プラン（パーソナライズ）
        </h2>
        <label className="mb-4 flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
          <span className="text-sm font-medium text-gray-700">自分だけの学習プランを表示</span>
          <input
            type="checkbox"
            checked={settings.showAppliedPlan}
            onChange={(e) =>
              setSettings((s) => ({ ...s, showAppliedPlan: e.target.checked }))
            }
            className="h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
          />
        </label>
        <p className="mb-4 text-xs text-gray-500">
          このトグルをONにすると、以下の設定がダッシュボードに反映されます。
        </p>

        {/* 4段階レベル（A・B共通の基本設定） */}
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

        <p className="mb-3 text-xs font-medium text-gray-600">A. 選択式</p>
        <p className="mb-2 text-xs text-gray-500">
          既存トピック（ITトレンド、経済、英語等）から選ぶと、1日の標準問題数（下で設定）で出題されます。
        </p>
        <div className="mb-6 flex flex-wrap gap-2">
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

        <p className="mb-2 text-xs font-medium text-gray-600">B. 生成AI式</p>
        <p className="mb-2 text-xs text-gray-500">
          自由記述で自分専用のトピック・問題を生成します。ここで付けた「カスタム学習名」がダッシュボードのカード見出しになります。
        </p>
        <p className="mb-3 text-xs text-amber-700/90 bg-amber-50/80 rounded-lg px-3 py-2 border border-amber-200/60">
          ※特に指示がない場合、回答の難易度は『基本設定』で選択した学習レベル（初級/中級/上級）が適用されます。
        </p>
        {/* カスタム学習名（選択肢Bのみ：ダッシュボードのカードタイトル） */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            カスタム学習名（このプランの名前）
          </label>
          <input
            type="text"
            value={settings.customQuizName}
            onChange={(e) =>
              setSettings((s) => ({ ...s, customQuizName: e.target.value }))
            }
            placeholder="例: 俺のAI営業修行、TOEIC 800への道"
            className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            ここで入力した名前がダッシュボードの学習カードのタイトルになります。
          </p>
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
            学びたいこと（例: ビジネス英語、毎日5問）
          </label>
          <p className="mb-1.5 text-[11px] text-gray-500">
            問題数は「毎日〇問」で指定可能。未指定時は基本設定の出題数を使用。
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <textarea
              value={settings.customLearningGoal}
              onChange={(e) =>
                setSettings((s) => ({ ...s, customLearningGoal: e.target.value }))
              }
              placeholder="例: AI営業用語、毎日5問"
              rows={1}
              className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#1E293B] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
          1日の標準問題数
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          選択式または生成AIで問題数を指定しない場合に適用されます（デフォルト5問）。
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
