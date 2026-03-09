/**
 * ユーザーが選択できる学習トピック（10個以上）。
 * LLMのメタ・プロンプトや日次コンテンツのフィルタに利用。
 */

export type TopicOption = {
  id: string;
  label: string;
  description?: string;
};

export const TOPICS: TopicOption[] = [
  { id: "latest_tech", label: "最新テック", description: "IT・ソフトウェアのトレンド" },
  { id: "economy", label: "経済", description: "マクロ・市場・経営" },
  { id: "history", label: "歴史", description: "教養・歴史から学ぶ" },
  { id: "psychology", label: "心理学", description: "行動心理・モチベーション" },
  { id: "gadgets", label: "最新ガジェット", description: "デバイス・ツール" },
  { id: "ai_ml", label: "AI・機械学習", description: "技術とビジネス応用" },
  { id: "business", label: "ビジネススキル", description: "交渉・プレゼン・マネジメント" },
  { id: "science", label: "科学", description: "自然科学・サイエンス" },
  { id: "language", label: "語学", description: "英語・TOEIC等" },
  { id: "productivity", label: "生産性", description: "時間管理・効率化" },
  { id: "marketing", label: "マーケティング", description: "集客・ブランディング" },
  { id: "finance", label: "金融・会計", description: "財務・投資の基礎" },
];

export const TOPIC_LABELS: Record<string, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.label]),
);
