/**
 * 4択クイズの出題プール（IT用語・英単語等）。
 * 忘却曲線エンジンは回答履歴と nextReviewAt で優先度を付けて出題する。
 */

export type QuizQuestion = {
  id: string;
  type: "it_term" | "vocab_en";
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
};

const POOL: QuizQuestion[] = [
  {
    id: "it_1",
    type: "it_term",
    question: "RAG の R は何の略か？",
    options: ["Retrieval", "Real-time", "Random", "Resource"],
    correctIndex: 0,
    explanation: "Retrieval-Augmented Generation。検索で取得した情報をLLMに渡して回答させる手法。",
  },
  {
    id: "it_2",
    type: "it_term",
    question: "LLM で「幻覚」のように事実でない内容を生成する現象を何というか？",
    options: ["Bug", "Hallucination", "Noise", "Drift"],
    correctIndex: 1,
    explanation: "Hallucination。出典のない記述を防ぐにはRAGや人間のチェックが有効。",
  },
  {
    id: "it_3",
    type: "it_term",
    question: "テキストをベクトルに変換し類似度検索に使う処理は？",
    options: ["Tokenize", "Embedding", "Encode", "Hash"],
    correctIndex: 1,
    explanation: "Embedding。意味が近い文はベクトルも近くなるため、検索・推薦に使われる。",
  },
  {
    id: "it_4",
    type: "it_term",
    question: "既存のLLMを自社データで追加学習させることを何というか？",
    options: ["Tuning", "Fine-tuning", "Training", "Adapting"],
    correctIndex: 1,
    explanation: "Fine-tuning。専門用語や社内文体に合わせて精度を上げるのに使う。",
  },
  {
    id: "it_5",
    type: "it_term",
    question: "AIが目標に向けてツールを組み合わせて実行する形態を何というか？",
    options: ["Bot", "Agent", "Pipeline", "Workflow"],
    correctIndex: 1,
    explanation: "Agent。検索・計算・API呼び出しなどを組み合わせて自律的にタスクを進める。",
  },
  {
    id: "vocab_1",
    type: "vocab_en",
    question: "「deadline」の意味は？",
    options: ["締め切り", "死線", "終了", "期限切れ"],
    correctIndex: 0,
    explanation: "deadline = 締め切り・期限。",
  },
  {
    id: "vocab_2",
    type: "vocab_en",
    question: "「feasible」の意味は？",
    options: ["不可能な", "実行可能な", "難しい", "簡単な"],
    correctIndex: 1,
    explanation: "feasible = 実行可能な、実現可能な。",
  },
  {
    id: "vocab_3",
    type: "vocab_en",
    question: "「stakeholder」の意味に最も近いのは？",
    options: ["株主のみ", "関係者全般", "顧客のみ", "従業員のみ"],
    correctIndex: 1,
    explanation: "stakeholder = 利害関係者。株主・顧客・従業員・取引先などを含む。",
  },
  {
    id: "vocab_4",
    type: "vocab_en",
    question: "「leverage」をビジネス文脈で使うと？",
    options: ["避ける", "活用する", "削減する", "無視する"],
    correctIndex: 1,
    explanation: "leverage = 活用する、梃子にする。リソースや強みを活用する意味。",
  },
  {
    id: "vocab_5",
    type: "vocab_en",
    question: "「quarter」がビジネスでよく使われる意味は？",
    options: ["15分", "四半期", "四分割", "25%"],
    correctIndex: 1,
    explanation: "quarter = 四半期（3ヶ月）。Q1, Q2 など。",
  },
  {
    id: "it_6",
    type: "it_term",
    question: "プロンプトで「段階的に考えてから答えを出してください」と促す手法は？",
    options: ["Zero-shot", "Chain of Thought", "Few-shot", "RAG"],
    correctIndex: 1,
    explanation: "Chain of Thought（CoT）。推論の中間ステップを明示させることで精度が上がる。",
  },
  {
    id: "vocab_6",
    type: "vocab_en",
    question: "「compliance」の意味は？",
    options: ["違反", "遵守・コンプライアンス", "同意", "拒否"],
    correctIndex: 1,
    explanation: "compliance = 法令遵守、コンプライアンス。",
  },
];

const QUESTION_MAP = new Map(POOL.map((q) => [q.id, q]));

export function getQuestionById(id: string): QuizQuestion | undefined {
  return QUESTION_MAP.get(id);
}

export function getAllQuestionIds(): string[] {
  return POOL.map((q) => q.id);
}

export function getQuestionsByIds(ids: string[]): QuizQuestion[] {
  return ids
    .map((id) => QUESTION_MAP.get(id))
    .filter((q): q is QuizQuestion => q != null);
}
