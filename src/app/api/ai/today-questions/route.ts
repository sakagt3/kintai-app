/**
 * 今日のN問を取得。復習（忘却曲線）分を混ぜ、残りをLLMで新規生成。
 * 日付ごとに問題が変わるようプロンプトに本日の日付を含める。A=トピック選択時は appliedPlanSummary またはトピックから指針を組み立てる。
 */
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOPICS } from "@/lib/topics";

const LEVEL_GUIDE: Record<string, string> = {
  beginner: "初心者向け：平易な言葉、短い文。",
  intermediate: "中級者向け：基本的な用語可。",
  advanced: "上級者向け：専門用語と背景に触れる。",
  pro: "プロ向け：業界標準用語で簡潔に。",
};

const SKIP_OPTION = "わからない（スキップ）";

type QuizItem = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  isReview?: boolean;
};

/** シード付き簡易シャッフル（0..n-1 のインデックスをシャッフル） */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 正解位置をランダム化。先頭4つをシャッフルし、最後は必ず「わからない」に固定。
 */
function shuffleOptionsAndFixSkip(
  options: string[],
  correctIndex: number,
  seed: number
): { options: string[]; correctIndex: number } {
  const four = options.slice(0, 4);
  const skip = options.length > 4 ? options[4] : SKIP_OPTION;
  const indices = seededShuffle([0, 1, 2, 3], seed);
  const shuffled = indices.map((i) => four[i]);
  const newCorrectIndex = indices.indexOf(correctIndex);
  return {
    options: [...shuffled, skip],
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
  };
}

function parseReviewSnapshot(snapshot: string | null): QuizItem | null {
  if (!snapshot) return null;
  try {
    const o = JSON.parse(snapshot) as {
      question?: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string;
    };
    if (!o?.question || !Array.isArray(o.options) || o.options.length < 4)
      return null;
    const opts = o.options.slice(0, 5);
    if (opts.length === 4) opts.push(SKIP_OPTION);
    const id = `review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return {
      id,
      question: String(o.question),
      options: opts,
      correctIndex: Math.min(3, Math.max(0, Number(o.correctIndex) ?? 0)),
      explanation: String(o.explanation ?? ""),
      isReview: true,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isMore = searchParams.get("more") === "1";
  const batchSeed = Number(searchParams.get("batch")) || 0;
  const isNewSession = searchParams.get("is_new_session") === "1";
  const excludeIdsRaw = searchParams.get("exclude_ids") ?? "";
  const excludeIds = excludeIdsRaw
    ? excludeIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const timestamp = Date.now();
  const uniqueId =
    searchParams.get("unique_id") ||
    `${timestamp}-${Math.random().toString(36).slice(2, 10)}`;

  const userId = session.user.id;
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  const goal = settings?.customLearningGoal?.trim() ?? "";
  const planSummary = settings?.appliedPlanSummary?.trim() ?? "";
  const level =
    settings?.learningLevel && ["beginner", "intermediate", "advanced", "pro"].includes(settings.learningLevel)
      ? settings.learningLevel
      : "intermediate";
  const countParam = searchParams.get("count");
  const dailyCount =
    countParam !== null && countParam !== ""
      ? Math.min(20, Math.max(1, parseInt(countParam, 10) || 10))
      : Math.min(20, Math.max(1, settings?.dailyQuizCount ?? 10));

  const questions: QuizItem[] = [];

  const today = new Date().toISOString().slice(0, 10);

  if (!isMore && !isNewSession) {
    // 忘却曲線：過去に間違えた問題・「わからない」を選んだ問題を優先して再出題（nextReviewAt が今日以前のもの）
    const reviewCandidates = await prisma.quizAttempt.findMany({
      where: {
        userId,
        questionSnapshot: { not: null },
        nextReviewAt: { lte: new Date(`${today}T23:59:59Z`) },
      },
      orderBy: { nextReviewAt: "asc" },
      take: Math.min(Math.max(1, Math.floor(dailyCount / 3)), 5),
    });

    const usedReviewIds: string[] = [];
    for (const r of reviewCandidates) {
      const item = parseReviewSnapshot(r.questionSnapshot);
      if (item) {
        item.id = `review-${r.id}`;
        const { options, correctIndex } = shuffleOptionsAndFixSkip(
          item.options,
          item.correctIndex,
          timestamp + r.id.length + batchSeed
        );
        item.options = options;
        item.correctIndex = correctIndex;
        questions.push(item);
        usedReviewIds.push(r.id);
      }
    }
    if (usedReviewIds.length > 0) {
      const nextShow = new Date();
      nextShow.setFullYear(nextShow.getFullYear() + 1);
      await prisma.quizAttempt.updateMany({
        where: { id: { in: usedReviewIds } },
        data: { nextReviewAt: nextShow },
      });
    }
  }

  let needNew = isMore ? dailyCount : dailyCount - questions.length;
  const levelGuide = LEVEL_GUIDE[level] ?? LEVEL_GUIDE.intermediate;

  // 問題バンクがあればここからランダム抽出（ダッシュボードと連携・毎回異なる問題）
  if (needNew > 0) {
    const bank = await prisma.questionBank.findUnique({
      where: { userId },
    });
    const raw = bank?.questions;
    const bankList: QuizItem[] = Array.isArray(raw)
      ? (raw as unknown[]).map((q: unknown, i: number) => {
          const x = q && typeof q === "object" ? (q as Record<string, unknown>) : {};
          return {
            id: typeof x.id === "string" ? x.id : `bank-${userId}-${i}`,
            question: String(x.question ?? ""),
            options: Array.isArray(x.options) ? (x.options as string[]) : [],
            correctIndex: Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0)),
            explanation: String(x.explanation ?? ""),
            isReview: false,
          };
        }).filter((q) => q.question && q.options.length >= 4)
      : [];
    const pool = bankList.filter(
      (q) => q.id && !excludeIds.includes(q.id)
    );
    if (pool.length >= needNew) {
      const shuffled = seededShuffle(pool, timestamp + batchSeed * 1000);
      for (let i = 0; i < needNew; i++) {
        const x = shuffled[i];
        let opts: string[] = Array.isArray(x.options) ? [...x.options].slice(0, 5) : [];
        if (opts.length < 4) opts = [...opts, "A", "B", "C", "D"].slice(0, 4);
        if (opts.length === 4) opts = [...opts, SKIP_OPTION];
        else if (opts[4] !== SKIP_OPTION && opts[4] !== "わからない") opts = [...opts.slice(0, 4), SKIP_OPTION];
        const correctIdx = Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0));
        const { options: shuffledOpts, correctIndex: newCorrectIdx } = shuffleOptionsAndFixSkip(
          opts,
          correctIdx,
          timestamp + i + batchSeed * 1000
        );
        questions.push({
          id: String(x.id),
          question: String(x.question ?? ""),
          options: shuffledOpts,
          correctIndex: newCorrectIdx,
          explanation: String(x.explanation ?? ""),
          isReview: false,
        });
      }
      needNew = 0;
    }
  }

  // A=トピックのみ選択の場合: preferredTopicIds から指針を組み立てる（バンクが無いときのLLM用）
  let effectivePlan = planSummary || goal;
  if (!effectivePlan && settings?.preferredTopicIds) {
    try {
      const ids = JSON.parse(settings.preferredTopicIds) as string[];
      if (Array.isArray(ids) && ids.length > 0) {
        const labels = ids
          .map((id) => TOPICS.find((t) => t.id === id)?.label ?? id)
          .filter(Boolean);
        effectivePlan = `選択トピック: ${labels.join("、")}。毎日${dailyCount}問の4択クイズをこれらのトピックから出題。`;
      }
    } catch {
      // ignore
    }
  }
  if (!effectivePlan) effectivePlan = "ビジネス教養";

  if (needNew > 0) {
    const excludeInstruction =
      excludeIds.length > 0
        ? `【重要】以下はすでに出題済み。これらと重複しない別問題を生成せよ。出題済みID: ${excludeIds.slice(0, 30).join(", ")}`
        : "";

    try {
      if (process.env.OPENAI_API_KEY) {
        const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
        let collected: QuizItem[] = [];
        const BATCH_SIZE = 5;
        const maxBatches = Math.min(4, Math.ceil(needNew / BATCH_SIZE));
        for (let batch = 0; batch < maxBatches && collected.length < needNew; batch++) {
          const toRequest = Math.min(BATCH_SIZE, needNew - collected.length);
          const seed = timestamp + batch * 10000;
          const prompt = `あなたは500問以上の問題データベースを持つ専門講師。必ず${toRequest}問だけJSON配列で出力。省略禁止。
【指針】${effectivePlan} 【レベル】${levelGuide} ${excludeInstruction}
【出力】JSON配列のみ。[ のあと${toRequest}個のオブジェクト。1要素: {"question":"30字以内","options":["A","B","C","D","わからない"],"correctIndex":0,"explanation":"20字以内"} correctIndexは0〜3。`;

          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt,
            maxOutputTokens: Math.max(800, toRequest * 250),
          });
          const trimmed = text.replace(/^[\s\S]*?(\[[\s\S]*\])[\s\S]*$/, "$1").trim();
          const arr = (() => {
            try {
              return JSON.parse(trimmed) as Array<{ question?: string; options?: string[]; correctIndex?: number; explanation?: string }>;
            } catch {
              return [];
            }
          })();
          const list = Array.isArray(arr) ? arr : [];
          const baseId = `new-${timestamp}-${batch}-`;
          for (let i = 0; i < list.length && collected.length < needNew; i++) {
            const x = list[i];
            if (!x?.question || !Array.isArray(x.options) || x.options.length < 4) continue;
            let opts = x.options.slice(0, 5);
            if (opts.length === 4) opts = [...opts, SKIP_OPTION];
            else if (opts[4] !== SKIP_OPTION && opts[4] !== "わからない") opts = [...opts.slice(0, 4), SKIP_OPTION];
            const correctIdx = Math.min(3, Math.max(0, Number(x.correctIndex) ?? 0));
            const { options: shuffledOpts, correctIndex: newCorrectIdx } = shuffleOptionsAndFixSkip(
              opts,
              correctIdx,
              seed + i + batchSeed * 1000
            );
            collected.push({
              id: `${baseId}${i}`,
              question: String(x.question),
              options: shuffledOpts,
              correctIndex: newCorrectIdx,
              explanation: String(x.explanation ?? ""),
              isReview: false,
            });
          }
        }
        questions.push(...collected.slice(0, needNew));
      } else {
        const MOCK_POOL: QuizItem[] = [
          { id: "m1", question: "RAGの「R」は何の略ですか？", options: ["Retrieval", "Real-time", "Random", "Resource", SKIP_OPTION], correctIndex: 0, explanation: "RAGは Retrieval-Augmented Generation の略。", isReview: false },
          { id: "m2", question: "LLMで「Hallucination」とは？", options: ["幻覚的な出力", "高速応答", "多言語対応", "暗号化", SKIP_OPTION], correctIndex: 0, explanation: "事実に基づかない内容を生成する現象。", isReview: false },
          { id: "m3", question: "機械学習の「教師あり学習」とは？", options: ["正解付きデータで学習", "ラベルなしのみで学習", "強化学習の別名", "推論のみ", SKIP_OPTION], correctIndex: 0, explanation: "正解付きデータでモデルを学習させる方式。", isReview: false },
          { id: "m4", question: "APIの「REST」の特徴は？", options: ["URLでリソース表現しHTTPで操作", "必ずXMLで通信", "状態をサーバーが保持", "TCPのみ", SKIP_OPTION], correctIndex: 0, explanation: "リソースをURLで表現しGET/POSTで操作。", isReview: false },
          { id: "m5", question: "「マイクロサービス」の利点は？", options: ["独立してスケール・デプロイ可", "1台のサーバーで動作", "モノリスより遅い", "言語統一必須", SKIP_OPTION], correctIndex: 0, explanation: "サービスを小さく分離し独立運用可能。", isReview: false },
          { id: "m6", question: "「DevOps」の目的は？", options: ["開発と運用の連携・自動化", "開発のみ", "運用のみ", "テストの省略", SKIP_OPTION], correctIndex: 0, explanation: "開発と運用を連携しリリースを効率化。", isReview: false },
          { id: "m7", question: "「CI」の略は？", options: ["Continuous Integration", "Central Intelligence", "Code Inspection", "Cache Invalidation", SKIP_OPTION], correctIndex: 0, explanation: "継続的インテグレーション。", isReview: false },
          { id: "m8", question: "「CD」の略は？", options: ["Continuous Delivery", "Compact Disk", "Code Deploy", "Cache Data", SKIP_OPTION], correctIndex: 0, explanation: "継続的デリバリー。", isReview: false },
          { id: "m9", question: "「API」の略は？", options: ["Application Programming Interface", "Advanced Program Input", "Automated Process Integration", "Application Protocol Internet", SKIP_OPTION], correctIndex: 0, explanation: "アプリケーション間の連携仕様。", isReview: false },
          { id: "m10", question: "「SQL」の用途は？", options: ["データベース問い合わせ", "シーケンス制御", "セキュリティ認証", "ストレージ管理", SKIP_OPTION], correctIndex: 0, explanation: "リレーショナルDBの問い合わせ言語。", isReview: false },
          { id: "m11", question: "「NoSQL」の特徴は？", options: ["スキーマが柔軟・分散向き", "必ずSQL文を使う", "1台のみ", "トランザクションのみ", SKIP_OPTION], correctIndex: 0, explanation: "非リレーショナルなDBの総称。", isReview: false },
          { id: "m12", question: "「キャッシュ」の目的は？", options: ["応答速度の向上", "永続保存", "暗号化", "バックアップ", SKIP_OPTION], correctIndex: 0, explanation: "頻出データを保持しアクセスを高速化。", isReview: false },
          { id: "m13", question: "「ロードバランサ」の役割は？", options: ["負荷を複数台に分散", "単一サーバーに集約", "ストレージ管理", "ログ収集", SKIP_OPTION], correctIndex: 0, explanation: "リクエストを複数サーバーに振り分ける。", isReview: false },
          { id: "m14", question: "「コンテナ」の利点は？", options: ["環境の再現性・軽量", "必ずVMより重い", "Windowsのみ", "ネットワーク不要", SKIP_OPTION], correctIndex: 0, explanation: "アプリと依存関係をまとめて実行。", isReview: false },
          { id: "m15", question: "「Kubernetes」の用途は？", options: ["コンテナのオーケストレーション", "データベース管理", "監視のみ", "CIのみ", SKIP_OPTION], correctIndex: 0, explanation: "コンテナのデプロイ・スケールを管理。", isReview: false },
          { id: "m16", question: "「OAuth」の用途は？", options: ["認可・委譲の標準", "暗号化のみ", "キャッシュ", "ログ", SKIP_OPTION], correctIndex: 0, explanation: "第三者に権限を委譲する認可の仕組み。", isReview: false },
          { id: "m17", question: "「JWT」とは？", options: ["JSON形式のトークン", "Java Web Tool", "JavaScript Widget", "JSON Web Table", SKIP_OPTION], correctIndex: 0, explanation: "署名付きJSONで情報を安全に渡す。", isReview: false },
          { id: "m18", question: "「CORS」の目的は？", options: ["異なるオリジン間のアクセス制御", "暗号化", "キャッシュ", "ログ", SKIP_OPTION], correctIndex: 0, explanation: "ブラウザのクロスオリジン制限を制御。", isReview: false },
          { id: "m19", question: "「HTTPS」で使うのは？", options: ["TLS/SSL", "HTTPのみ", "FTP", "SMTP", SKIP_OPTION], correctIndex: 0, explanation: "通信を暗号化するプロトコル。", isReview: false },
          { id: "m20", question: "「イミュータブル」の意味は？", options: ["変更不可", "高速", "一時的", "分散", SKIP_OPTION], correctIndex: 0, explanation: "作成後に状態を変えない設計。", isReview: false },
        ];
        const shuffled = seededShuffle([...MOCK_POOL], timestamp + batchSeed * 1000);
        for (let i = 0; i < needNew; i++) {
          const t = shuffled[i % shuffled.length];
          const { options: shuffledOpts, correctIndex: newCorrectIdx } = shuffleOptionsAndFixSkip(
            t.options,
            t.correctIndex,
            timestamp + i + batchSeed * 1000
          );
          questions.push({
            ...t,
            id: `new-${timestamp}-${i}`,
            options: shuffledOpts,
            correctIndex: newCorrectIdx,
          });
        }
      }
    } catch (e) {
      console.error("today-questions generate:", e);
    }
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recent = await prisma.quizAttempt.findMany({
    where: { userId, answeredAt: { gte: sevenDaysAgo } },
    select: { correct: true },
  });
  const total = recent.length;
  const correctCount = recent.filter((r) => r.correct).length;
  const retentionRate = total > 0 ? Math.round((correctCount / total) * 100) : null;

  return NextResponse.json(
    {
      questions,
      retentionRate,
      dailyQuizCount: dailyCount,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    }
  );
}
