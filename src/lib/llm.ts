/**
 * LLM連携の雛形（GPT/Gemini等）。
 * ユーザーの「学びたいこと」自由記述とトピックから、
 * 毎日生成するコンテンツ用のプロンプトを組み立てる拡張ポイント。
 */

export type LLMConfig = {
  provider?: "openai" | "gemini" | "anthropic";
  apiKey?: string;
  model?: string;
};

/**
 * ユーザーの学習目標とトピックから、日次コンテンツ生成用のメタ・プロンプトを組み立てる。
 * 実際のAPI呼び出しは環境変数で有効化し、未設定時はモックまたはスキップ。
 */
export function buildDailyContentPrompt(params: {
  customLearningGoal: string | null;
  preferredTopicIds: string[];
  topicLabels: Record<string, string>;
  date: string;
}): string {
  const { customLearningGoal, preferredTopicIds, topicLabels, date } = params;
  const topicNames = preferredTopicIds
    .map((id) => topicLabels[id] || id)
    .filter(Boolean);
  const goalLine = customLearningGoal
    ? `ユーザーの学習目標: ${customLearningGoal}`
    : "ユーザーの学習目標: 指定なし（汎用ビジネス教養）";
  const topicLine =
    topicNames.length > 0
      ? `興味トピック: ${topicNames.join("、")}`
      : "興味トピック: 未選択（汎用）";

  return [
    `日付: ${date}`,
    goalLine,
    topicLine,
    "上記に沿った、その日の「1つ学べるコンテンツ」（要約・キーポイント・アクション）を生成してください。",
  ].join("\n");
}

/**
 * 将来的にAPIを叩く入口。現状はプロンプト文字列を返すのみ。
 * 実装例: fetch("/api/llm/generate", { method: "POST", body: JSON.stringify({ prompt }) })
 */
export async function generateDailyContent(params: {
  customLearningGoal: string | null;
  preferredTopicIds: string[];
  topicLabels: Record<string, string>;
}): Promise<{ content: string; source: "llm" | "mock" }> {
  const date = new Date().toISOString().slice(0, 10);
  const prompt = buildDailyContentPrompt({
    ...params,
    date,
  });

  // 環境変数でLLM APIが設定されていない場合はモック返却
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    return {
      content: `[モック] 本日の学習テーマ: ${params.customLearningGoal || "ビジネス教養"}。トピック: ${params.preferredTopicIds.length ? params.preferredTopicIds.join(", ") : "汎用"}。実際のAPI連携時はここにLLM生成テキストが入ります。`,
      source: "mock",
    };
  }

  // TODO: 実際のAPI呼び出し（OpenAI / Gemini 等）
  // const response = await fetch(...);
  // const data = await response.json();
  // return { content: data.choices[0].message.content, source: "llm" };
  return {
    content: prompt,
    source: "mock",
  };
}
