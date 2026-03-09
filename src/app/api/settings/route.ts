/**
 * 設定API: GET でユーザー設定・プロフィール取得、PATCH で設定・名前を更新する。
 * 学習トピック・カスタム目標・クイズ出題数・表示ON/OFF・表示ボリュームを含む。
 */
import { NextResponse } from "next/server";
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = session.user.id;
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        showSpecialDay: true,
        showAiNews: true,
        showAiTerm: true,
        displayMode: "standard",
        displayVolume: "simple",
        dailyQuizCount: 5,
        learningLevel: "intermediate",
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

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

  return NextResponse.json({
    settings: {
      showSpecialDay: settings.showSpecialDay,
      showAiNews: settings.showAiNews,
      showAiTerm: settings.showAiTerm ?? true,
      displayMode: settings.displayMode,
      displayVolume: settings.displayVolume ?? "simple",
      preferredTopicIds,
      customLearningGoal: settings.customLearningGoal ?? "",
      dailyQuizCount: settings.dailyQuizCount ?? 5,
      learningLevel: settings.learningLevel ?? "intermediate",
      contentFocus: settings.contentFocus ?? "topic",
      appliedPlanSummary: settings.appliedPlanSummary ?? "",
    },
    profile: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
  });
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
  const name = typeof raw.name === "string" ? raw.name.trim() : undefined;

  const userId = session.user.id;

  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      showSpecialDay: showSpecialDay ?? true,
      showAiNews: showAiNews ?? true,
      showAiTerm: showAiTerm ?? true,
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
    },
    update: {
      ...(showSpecialDay !== undefined && { showSpecialDay }),
      ...(showAiNews !== undefined && { showAiNews }),
      ...(showAiTerm !== undefined && { showAiTerm }),
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
    },
  });

  if (name !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name || null },
    });
  }

  return NextResponse.json({ success: true });
}
