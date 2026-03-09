/**
 * AI業界のデイリーニュース（モック）。
 * 将来的に外部API（RSS・ニュースAPI等）に差し替えしやすい型・インターフェースで提供する。
 */

export type AiNewsItem = {
  id: string;
  title: string;
  summary: string;
  /** 詳細解説用の長文（2〜3段落）。API連携時は要約APIで生成想定 */
  detail?: string;
  source?: string;
  url?: string;
  category?: "RAG" | "エージェント" | "新モデル" | "規制" | "ビジネス" | "その他";
  publishedAt?: string; // ISO8601
};

/** モック用: 日付に応じて安定して1件返す（API連携時は日次取得に差し替え） */
const MOCK_ITEMS: AiNewsItem[] = [
  {
    id: "1",
    title: "RAGの実務導入が加速、社内ナレッジ検索の標準に",
    summary:
      "検索拡張生成（RAG）を社内ドキュメントやFAQに適用する事例が増加。LLM単体より hallucination が減り、根拠付き回答が可能になるとして、企業の PoC が本番運用に移行しつつある。",
    detail:
      "RAG（Retrieval-Augmented Generation）は、外部の知識ベースを検索し、その結果をプロンプトに含めてLLMに回答させる手法です。社内ナレッジやマニュアルをベクトルDBに格納し、質問に応じて関連チャンクだけを渡すことで、 hallucination を抑えつつ最新情報を反映した回答が得られます。\n\n実務では、Embedding モデルと検索の粒度（チャンクサイズ・オーバーラップ）、再ランキングの有無が精度を左右します。まずは限定的なドメインで PoC し、ユーザーフィードバックで改善するサイクルがおすすめです。",
    source: "AI Trends Digest（モック）",
    url: "https://aws.amazon.com/blogs/machine-learning/rag/",
    category: "RAG",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "AIエージェント、タスク分解とツール利用が主流に",
    summary:
      "単発のQ&Aではなく、目標に向けて計画・実行・振り返りを行うエージェント型AIが注目。コード実行・検索・API呼び出しを組み合わせた自律動作が、業務自動化の次の一手として期待されている。",
    detail:
      "エージェント型AIは、ユーザーが示した目標に対して、内部でタスクを分解し、検索・計算・API呼び出しなどのツールを組み合わせて段階的に実行します。ReAct や Plan-and-Execute といったパターンが知られ、LangChain や CrewAI などのフレームワークで実装が容易になってきました。\n\nビジネスでは、顧客問い合わせの一次対応、レポート下書き、データ集計の自動化などに適用されています。実運用では、実行ステップのログとガードレール（権限・範囲の制限）の設計が重要です。",
    source: "AI Trends Digest（モック）",
    url: "https://langchain.com",
    category: "エージェント",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "新モデル発表相次ぐ、マルチモーダルと長文対応が焦点",
    summary:
      "主要ベンダーから画像・音声を扱うマルチモーダルモデルや、コンテキスト長を拡張したモデルが続々発表。コスト低下と性能向上により、業務での利用ハードルが下がっている。",
    detail:
      "画像入力・音声入出力に対応したモデルにより、契約書のスキャン読み取り、会議の要約、音声での操作など、これまで別システムで行っていた処理を一つのパイプラインで扱えるようになりつつあります。\n\nコンテキスト長の拡張（100k〜200万トークン）により、長い仕様書や複数ドキュメントをまとめて参照した回答が可能になり、開発・法務・営業の業務効率化に直結しています。選定時は、入力単価・レイテンシ・言語対応を用途に合わせて比較するのがおすすめです。",
    source: "AI Trends Digest（モック）",
    url: "https://openai.com/blog",
    category: "新モデル",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "AI規制とガバナンス、EU AI Act と企業の対応",
    summary:
      "EUを中心にAIのリスクに応じた規制の枠組みが整備されつつある。高リスク用途では説明可能性やログが求められ、企業は利用目的ごとのリスク分類と対策が求められる。",
    detail:
      "EU AI Act では、用途をリスクレベルで分類し、高リスクシステムには透明性・ログ・ヒューマンオーバーライドなどの要件が課されます。日本でもガイドラインの整備が進んでおり、生成AIの業務利用では、著作権・個人情報・出力の検証が論点になります。\n\n企業では、AI利用ポリシーの策定、プロバイダ選定時の契約・SLA確認、社内教育が急務です。まずは「どこにAIを使い、どこは人が判断するか」を明文化することから始めるとよいでしょう。",
    source: "AI Trends Digest（モック）",
    url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    category: "規制",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "生成AIのROI測定、生産性指標の見える化",
    summary:
      "生成AI導入後の効果測定として、タスク時間短縮・品質スコア・従業員満足度などを指標化する事例が増加。定性だけでなく数値で示すことで、次の投資判断や拡大方針につなげている。",
    detail:
      "効果測定では、導入前後のタスク完了時間、エラー率、承認率、アンケートによる「使いやすさ」や「時間削減感」を記録します。部署ごと・ユースケースごとにダッシュボード化し、どこで効いているか・どこで躓いているかを可視化することが重要です。\n\n短期的な生産性向上に加え、イノベーション（新サービス・新プロセスの創出）への貢献も中長期で追うと、経営層の理解を得やすくなります。",
    source: "AI Trends Digest（モック）",
    url: "https://hbr.org/topic/subject/artificial-intelligence",
    category: "ビジネス",
    publishedAt: new Date().toISOString(),
  },
];

/**
 * 今日のAIニュースを1件返す（モック: 日付のハッシュで選択。将来はAPIに差し替え）
 */
export function getTodaysAiNews(): AiNewsItem {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  const day = jst.getUTCDate();
  const dayOfYear = Math.floor(
    (new Date(year, month, day).getTime() -
      new Date(year, 0, 0).getTime()) /
      86400000,
  );
  const index = dayOfYear % MOCK_ITEMS.length;
  const item = MOCK_ITEMS[index];
  return { ...item, publishedAt: now.toISOString() };
}
