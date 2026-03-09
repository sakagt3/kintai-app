/**
 * 設定API: GET でユーザー設定・プロフィール取得、PATCH で設定・名前を更新する。
 * 学習トピック・カスタム目標・クイズ出題数・表示ON/OFF・表示ボリュームを含む。
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DISPLAY_MODES = ["standard", "detail_special", "detail_news"] as const;
const DISPLAY_VOLUMES = ["simple", "detailed"] as const;
const LEARNING_LEVELS = ["beginner", "intermediate", "advanced", "pro"] as const;
const CONTENT_FOCUS = ["topic", "quiz"] as const;

function parseTopicIds(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const arr = v.filter((x) => typeof x === "string");
  return arr.length ? arr : undefined;
}

const CARD_ORDER_KEYS = ["specialDay", "learning", "aiTerm", "headline"] as const;

function parseCardOrder(v: string | null | undefined): string[] {
  if (!v) return [...CARD_ORDER_KEYS];
  try {
    const parsed = JSON.parse(v) as unknown;
    if (!Array.isArray(parsed)) return [...CARD_ORDER_KEYS];
    const valid = parsed.filter((x) => typeof x === "string" && CARD_ORDER_KEYS.includes(x as (typeof CARD_ORDER_KEYS)[number]));
    const set = new Set(valid);
    const rest = CARD_ORDER_KEYS.filter((k) => !set.has(k));
    return valid.length ? [...valid, ...rest] : [...CARD_ORDER_KEYS];
  } catch {
    return [...CARD_ORDER_KEYS];
  }
}

/** 設定API GET 用のデフォルトレスポンス（500 時もクライアントが同じ形で受け取れるようにする） */
function defaultSettingsResponse(profile?: { name?: string; email?: string }) {
  return NextResponse.json({
    settings: {
      showSpecialDay: true,
      showAiNews: true,
      showAiTerm: true,
      showAppliedPlan: true,
      displayMode: "standard",
      displayVolume: "simple",
      preferredTopicIds: [] as string[],
      customLearningGoal: "",
      dailyQuizCount: 5,
      learningLevel: "intermediate",
      contentFocus: "topic",
      appliedPlanSummary: "",
      dashboardCardOrder: [...CARD_ORDER_KEYS],
      customQuizName: "",
    },
    profile: {
      name: profile?.name ?? "",
      email: profile?.email ?? "",
    },
  });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const userId = session.user.id;
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      try {
        settings = await prisma.userSettings.create({
          data: {
            userId,
            showSpecialDay: true,
            showAiNews: true,
            showAiTerm: true,
            showAppliedPlan: true,
            displayMode: "standard",
            displayVolume: "simple",
            dailyQuizCount: 5,
            learningLevel: "intermediate",
            contentFocus: "topic",
          },
        });
      } catch (createErr) {
        console.error("[GET /api/settings] create failed:", createErr);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }).catch(() => null);
        return defaultSettingsResponse(
          user ? { name: user.name ?? undefined, email: user.email } : undefined
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }).catch(() => null);

    let preferredTopicIds: string[] = [];
    if (settings.preferredTopicIds) {
      try {
        const parsed = JSON.parse(settings.preferredTopicIds);
        preferredTopicIds = Array.isArray(parsed)
          ? parsed.filter((x: unknown) => typeof x === "string")
          : [];
      } catch {
        preferredTopicIds = [];
      }
    }

    const cardOrder = (settings as { dashboardCardOrder?: string | null }).dashboardCardOrder;
    return NextResponse.json({
      settings: {
        showSpecialDay: settings.showSpecialDay,
        showAiNews: settings.showAiNews,
        showAiTerm: settings.showAiTerm ?? true,
        showAppliedPlan: settings.showAppliedPlan ?? true,
        displayMode: settings.displayMode,
        displayVolume: settings.displayVolume ?? "simple",
        preferredTopicIds,
        customLearningGoal: settings.customLearningGoal ?? "",
        dailyQuizCount: settings.dailyQuizCount ?? 5,
        learningLevel: settings.learningLevel ?? "intermediate",
        contentFocus: settings.contentFocus ?? "topic",
        appliedPlanSummary: settings.appliedPlanSummary ?? "",
        dashboardCardOrder: parseCardOrder(cardOrder),
        customQuizName: settings.customQuizName ?? "",
      },
      profile: {
        name: user?.name ?? "",
        email: user?.email ?? "",
      },
    });
  } catch (e) {
    console.error("[GET /api/settings]", e);
    return defaultSettingsResponse();
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const showSpecialDay =
    typeof raw.showSpecialDay === "boolean" ? raw.showSpecialDay : undefined;
  const showAiNews =
    typeof raw.showAiNews === "boolean" ? raw.showAiNews : undefined;
  const showAiTerm =
    typeof raw.showAiTerm === "boolean" ? raw.showAiTerm : undefined;
  const showAppliedPlan =
    typeof raw.showAppliedPlan === "boolean" ? raw.showAppliedPlan : undefined;
  const displayMode =
    typeof raw.displayMode === "string" &&
    DISPLAY_MODES.includes(raw.displayMode as (typeof DISPLAY_MODES)[number])
      ? raw.displayMode
      : undefined;
  const displayVolume =
    typeof raw.displayVolume === "string" &&
    DISPLAY_VOLUMES.includes(raw.displayVolume as (typeof DISPLAY_VOLUMES)[number])
      ? raw.displayVolume
      : undefined;
  const preferredTopicIds = parseTopicIds(raw.preferredTopicIds);
  const customLearningGoal =
    typeof raw.customLearningGoal === "string"
      ? raw.customLearningGoal.trim() || null
      : undefined;
  const dailyQuizCount =
    typeof raw.dailyQuizCount === "number" &&
    raw.dailyQuizCount >= 1 &&
    raw.dailyQuizCount <= 20
      ? raw.dailyQuizCount
      : undefined;
  const learningLevel =
    typeof raw.learningLevel === "string" &&
    LEARNING_LEVELS.includes(raw.learningLevel as (typeof LEARNING_LEVELS)[number])
      ? raw.learningLevel
      : undefined;
  const contentFocus =
    typeof raw.contentFocus === "string" &&
    CONTENT_FOCUS.includes(raw.contentFocus as (typeof CONTENT_FOCUS)[number])
      ? raw.contentFocus
      : undefined;
  const appliedPlanSummary =
    typeof raw.appliedPlanSummary === "string"
      ? raw.appliedPlanSummary.trim() || null
      : undefined;
  const customQuizName =
    typeof raw.customQuizName === "string"
      ? raw.customQuizName.trim() || null
      : undefined;
  const rawCardOrder = raw.dashboardCardOrder;
  const cardOrderArr = Array.isArray(rawCardOrder)
    ? (rawCardOrder as unknown[]).filter((x) => typeof x === "string")
    : undefined;
  const cardOrderStr =
    cardOrderArr && cardOrderArr.length > 0
      ? JSON.stringify(parseCardOrder(JSON.stringify(cardOrderArr)))
      : undefined;
  const name = typeof raw.name === "string" ? raw.name.trim() : undefined;

  const userId = session.user.id;

  try {
    await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      showSpecialDay: showSpecialDay ?? true,
      showAiNews: showAiNews ?? true,
      showAiTerm: showAiTerm ?? true,
      showAppliedPlan: showAppliedPlan ?? true,
      displayMode: (displayMode as (typeof DISPLAY_MODES)[number]) ?? "standard",
      displayVolume:
        (displayVolume as (typeof DISPLAY_VOLUMES)[number]) ?? "simple",
      preferredTopicIds:
        preferredTopicIds && preferredTopicIds.length > 0
          ? JSON.stringify(preferredTopicIds)
          : null,
      customLearningGoal: customLearningGoal ?? null,
      dailyQuizCount: dailyQuizCount ?? 5,
      learningLevel: (learningLevel as (typeof LEARNING_LEVELS)[number]) ?? "intermediate",
      contentFocus: (contentFocus as (typeof CONTENT_FOCUS)[number]) ?? "topic",
      appliedPlanSummary: appliedPlanSummary ?? null,
      dashboardCardOrder: null,
      customQuizName: null,
    },
    update: {
      ...(showSpecialDay !== undefined && { showSpecialDay }),
      ...(showAiNews !== undefined && { showAiNews }),
      ...(showAiTerm !== undefined && { showAiTerm }),
      ...(showAppliedPlan !== undefined && { showAppliedPlan }),
      ...(displayMode !== undefined && { displayMode }),
      ...(displayVolume !== undefined && { displayVolume }),
      ...(preferredTopicIds !== undefined && {
        preferredTopicIds:
          preferredTopicIds.length > 0
            ? JSON.stringify(preferredTopicIds)
            : null,
      }),
      ...(customLearningGoal !== undefined && {
        customLearningGoal: customLearningGoal,
      }),
      ...(dailyQuizCount !== undefined && { dailyQuizCount }),
      ...(learningLevel !== undefined && { learningLevel }),
      ...(contentFocus !== undefined && { contentFocus }),
      ...(appliedPlanSummary !== undefined && { appliedPlanSummary }),
      ...(cardOrderStr !== undefined && { dashboardCardOrder: cardOrderStr }),
      ...(customQuizName !== undefined && { customQuizName: customQuizName }),
    },
  });
  } catch (e) {
    console.error("Settings PATCH failed:", e);
    return NextResponse.json(
      {
        error:
          "設定の保存に失敗しました。データベースのマイグレーション（npx prisma db push）が必要な場合があります。",
      },
      { status: 500 }
    );
  }

  if (name !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name || null },
    });
  }

  revalidatePath("/dashboard");
  return NextResponse.json({ success: true });
}
