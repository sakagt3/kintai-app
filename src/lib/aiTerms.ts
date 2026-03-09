/**
 * 営業向けAI用語の日替わり解説（用語説明・お客様向けトーク例・ビジネス使用用途）
 */

export type AiTermEntry = {
  term: string;
  explanation: string;
  talkExample: string;
  businessUse: string;
};

const TERMS: AiTermEntry[] = [
  {
    term: "LLM",
    explanation:
      "Large Language Model（大規模言語モデル）の略。膨大なテキストで学習したAIで、文章の生成・要約・質問応答などができます。",
    talkExample:
      "「御社の問い合わせ対応を、LLMで自動返信の下書きに使うと、担当者の確認だけで済み、工数削減になります。」",
    businessUse:
      "メール下書き、FAQ案内、契約書の要約、アイデア出しなど。",
  },
  {
    term: "RAG",
    explanation:
      "Retrieval-Augmented Generation。検索で取得した社内ドキュメント等をプロンプトに含めてLLMに答えさせる手法。 hallucination を抑えつつ自社の情報で回答できます。",
    talkExample:
      "「RAGを入れると、マニュアルや過去の議事録を参照したうえで回答するので、根拠のある案内ができます。」",
    businessUse:
      "社内ナレッジ検索、カスタマーサポート、技術資料のQ&A。",
  },
  {
    term: "Agent",
    explanation:
      "目標に対して自らタスクを分解し、検索・計算・API呼び出しなどのツールを組み合わせて段階的に実行するAI。単発のQ&Aではなく「やり遂げる」動きをします。",
    talkExample:
      "「エージェント型にすると、『売上レポートをまとめて』と頼むと、データ取得から集計・グラフまで一気にやってくれます。」",
    businessUse:
      "レポート自動作成、問い合わせの一次対応、データ集計・可視化。",
  },
  {
    term: "Prompt",
    explanation:
      "LLMに渡す指示や質問のテキスト。書き方で出力の質が変わるため、良いプロンプトを設計・蓄積することが重要です。",
    talkExample:
      "「同じモデルでも、プロンプトを少し変えるだけで、トーンや長さが変わります。社内でテンプレを揃えると再現性が出ます。」",
    businessUse:
      "定型業務の指示、テンプレート化、品質の安定化。",
  },
  {
    term: "Fine-tuning",
    explanation:
      "既存のLLMを自社データで追加学習させること。専門用語や社内文体に合わせて精度を上げられます。",
    talkExample:
      "「ファインチューニングで、御社の過去の提案書を覚えさせると、同じ言い回しの案がすぐ出ます。」",
    businessUse:
      "専門分野の用語・文体、社内フォーマットへの適合。",
  },
  {
    term: "Embedding",
    explanation:
      "テキストを固定長のベクトル（数値の並び）に変換する処理。似た意味の文は似たベクトルになるため、検索・分類・類似度計算に使います。",
    talkExample:
      "「Embeddingで社内ドキュメントをベクトル化しておくと、質問に近い段落だけを拾ってRAGに渡せます。」",
    businessUse:
      "セマンティック検索、類似記事の推薦、クラスタリング。",
  },
  {
    term: "Hallucination",
    explanation:
      "LLMが事実に基づかない内容を「それらしく」生成してしまう現象。出典のない数字や存在しない文献を挙げるなど。",
    talkExample:
      "「Hallucination を減らすには、RAGで根拠を渡すか、回答後に人間がチェックする運用が有効です。」",
    businessUse:
      "品質管理、ガイドライン整備、RAG/検証の組み合わせ。",
  },
  {
    term: "Token",
    explanation:
      "LLMが処理する最小単位。日本語は1文字が複数トークンになることが多く、入力・出力の「長さ」や課金はトークン数で数えます。",
    talkExample:
      "「長い資料をそのまま渡すとトークン数が増えてコストと遅延が増えるので、要約や関連部分だけ渡す設計にしています。」",
    businessUse:
      "コスト見積もり、入力長の制限設計、要約・チャンク分割。",
  },
  {
    term: "Chain of Thought",
    explanation:
      "「考えの中間ステップ」をプロンプトで促し、段階的に推論させる手法。複雑な問題で正解率が上がることがあります。",
    talkExample:
      "「難しい計算や判断は、『ステップごとに理由を書いてから答えを出してください』と指示すると精度が上がります。」",
    businessUse:
      "分析・意思決定支援、計算タスク、多段階の推論。",
  },
  {
    term: "Guardrail",
    explanation:
      "AIの出力を制限・検証する仕組み。禁止ワードのブロック、フォーマットチェック、事実性検証など。",
    talkExample:
      "「Guardrail で社外秘の言及や不適切な表現をブロックしておくと、安心して業務で使えます。」",
    businessUse:
      "コンプライアンス、情報漏洩防止、出力品質の担保。",
  },
];

/** 日付に応じて1件返す（営業で使いやすいAI用語） */
export function getTodaysAiTerm(): AiTermEntry {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dayOfYear = Math.floor(
    (jst.getTime() - new Date(jst.getUTCFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const index = dayOfYear % TERMS.length;
  return TERMS[index];
}
