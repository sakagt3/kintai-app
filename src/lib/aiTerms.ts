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
  { term: "Transformer", explanation: "Attention機構で文脈を考慮するニューラルネットの構造。GPTやBERTの基盤。", talkExample: "「Transformerが翻訳や要約の精度を一気に上げた技術です。」", businessUse: "自然言語処理の基盤技術。" },
  { term: "GPT", explanation: "Generative Pre-trained Transformer。事前学習したテキスト生成モデル。", talkExample: "「ChatGPTのようなGPT系で、社内の文章作成を補助できます。」", businessUse: "文章生成、対話、要約。" },
  { term: "BERT", explanation: "双方向の文脈を考慮した事前学習モデル。分類・検索に強い。", talkExample: "「BERTでキーワード検索より意味が近い文書を探せます。」", businessUse: "検索、分類、意図理解。" },
  { term: "API", explanation: "Application Programming Interface。ソフト同士がデータをやり取りする窓口。", talkExample: "「AIのAPIを組み込むと、既存システムからそのまま利用できます。」", businessUse: "システム連携、自動化。" },
  { term: "GPU", explanation: "グラフィック処理用の演算装置。深層学習の並列計算に使われる。", talkExample: "「大量のデータで学習するにはGPUが必須です。」", businessUse: "学習・推論の高速化。" },
  { term: "機械学習", explanation: "データからパターンを学び、予測や分類を行う技術の総称。", talkExample: "「機械学習で需要予測や異常検知が自動化できます。」", businessUse: "予測、分類、推薦。" },
  { term: "深層学習", explanation: "多層のニューラルネットによる学習。画像・音声・言語で高い精度。", talkExample: "「深層学習で画像の自動タグ付けや音声認識が可能です。」", businessUse: "画像認識、音声、NLP。" },
  { term: "推論", explanation: "学習済みモデルに新しいデータを入れて結果を得る処理。", talkExample: "「学習は一度で、推論は毎日リアルタイムで回せます。」", businessUse: "本番運用、リアルタイム判定。" },
  { term: "学習", explanation: "モデルがデータからパラメータを更新し、タスクに適応する過程。", talkExample: "「御社データで学習すると、自社向けに精度が上がります。」", businessUse: "カスタマイズ、精度向上。" },
  { term: "過学習", explanation: "訓練データに合わせすぎて、未知データで性能が落ちること。", talkExample: "「過学習を防ぐには、検証データで早めに止めることが大事です。」", businessUse: "汎化性能の維持。" },
  { term: "チャンク", explanation: "長文を分割した断片。RAGでは検索・渡す単位として使う。", talkExample: "「チャンクの大きさで、検索精度とコストのバランスが変わります。」", businessUse: "RAG、長文処理。" },
  { term: "ベクトルDB", explanation: "Embeddingを保存し、類似度検索ができるデータベース。", talkExample: "「ベクトルDBにマニュアルを入れて、質問に近い箇所を即検索できます。」", businessUse: "セマンティック検索、RAG。" },
  { term: "プロンプトエンジニアリング", explanation: "プロンプトの設計・改善でLLMの出力品質を高める手法。", talkExample: "「プロンプトエンジニアリングで、少ない変更で精度を上げられます。」", businessUse: "コストを抑えた品質向上。" },
  { term: "Few-shot", explanation: "プロンプトに少数の入力・出力例を入れて挙動を誘導する手法。", talkExample: "「Few-shotで、フォーマットやトーンを例だけで揃えられます。」", businessUse: "テンプレート化、一貫性。" },
  { term: "Zero-shot", explanation: "例なしでプロンプトだけでタスクをさせること。", talkExample: "「Zero-shotでもある程度動くので、まずは試してから Few-shot を検討できます。」", businessUse: "素早いPoC。" },
  { term: "コンテキスト", explanation: "LLMに渡す入力全体（プロンプト＋検索結果など）の文脈。", talkExample: "「コンテキストに社内ルールを入れると、その範囲で答えてくれます。」", businessUse: "挙動の制御、安全運用。" },
  { term: "コンテキストウィンドウ", explanation: "LLMが一度に扱える入力・出力の最大トークン数。", talkExample: "「コンテキストウィンドウを超える長文は要約してから渡す設計にしています。」", businessUse: "長文対応、コスト設計。" },
  { term: "ストリーミング", explanation: "応答を先頭から順に返す方式。体感速度が上がる。", talkExample: "「ストリーミングにすると、ユーザーが待ち時間を短く感じます。」", businessUse: "UX向上。" },
  { term: "マルチモーダル", explanation: "テキスト以外（画像・音声など）も扱えるAI。", talkExample: "「マルチモーダルで、画像を渡して説明文を自動生成できます。」", businessUse: "画像・音声の活用。" },
  { term: "画像認識", explanation: "画像から物体・シーン・文字などを検出・分類する技術。", talkExample: "「画像認識で伝票や名刺の自動入力ができます。」", businessUse: "OCR、検品、分類。" },
  { term: "音声認識", explanation: "音声をテキストに変換する技術。", talkExample: "「音声認識で会議の文字起こしやハンズフリー操作が可能です。」", businessUse: "文字起こし、音声UI。" },
  { term: "テキスト要約", explanation: "長文を短く要約する処理。抽出型と生成型がある。", talkExample: "「テキスト要約で議事録やレポートの要点を自動で出せます。」", businessUse: "情報の圧縮、速読支援。" },
  { term: "感情分析", explanation: "テキストや発話のポジティブ・ネガティブ等を判定する分析。", talkExample: "「感情分析でお客様の声の傾向を可視化できます。」", businessUse: "顧客フィードバック分析。" },
  { term: "NER", explanation: "Named Entity Recognition。文中の人名・組織・日付などを抽出する技術。", talkExample: "「NERで契約書から会社名や日付を自動抽出できます。」", businessUse: "文書の構造化、検索。" },
  { term: "分類", explanation: "入力をあらかじめ決めたラベルに振り分けるタスク。", talkExample: "「問い合わせを分類して、担当部署に自動振り分けできます。」", businessUse: "ルーティング、タグ付け。" },
  { term: "クラスタリング", explanation: "ラベルなしでデータを似たもの同士のグループに分ける手法。", talkExample: "「クラスタリングで顧客セグメントをデータから発見できます。」", businessUse: "セグメント分析、可視化。" },
  { term: "推薦システム", explanation: "ユーザーの興味に合いそうなアイテムを推薦する仕組み。", talkExample: "「推薦システムで関連商品や次のアクションを提案できます。」", businessUse: "EC、コンテンツ配信。" },
  { term: "異常検知", explanation: "通常と異なるパターンや値を検出する技術。", talkExample: "「異常検知でトラブルや不正を早期に検知できます。」", businessUse: "監視、セキュリティ。" },
  { term: "A/Bテスト", explanation: "複数案を同時に試し、指標でどれが良いか比較する手法。", talkExample: "「プロンプトやUIをA/Bテストで改善できます。」", businessUse: "意思決定のデータ化。" },
  { term: "MLOps", explanation: "機械学習モデルの開発からデプロイ・運用までを管理する考え方。", talkExample: "「MLOpsでモデルの再学習やロールバックを安全に回せます。」", businessUse: "本番運用、品質維持。" },
  { term: "デプロイ", explanation: "開発したモデルやAPIを本番環境で動かすこと。", talkExample: "「デプロイ後も監視とロールバック手順を用意しています。」", businessUse: "リリース、運用。" },
  { term: "スコアリング", explanation: "モデルが出力したスコア（確率・スコア値）で判定や順位付けをすること。", talkExample: "「スコアリングで優先度やリスクを数値化して振り分けできます。」", businessUse: "優先度付け、リスク評価。" },
  { term: "バッチ処理", explanation: "データをまとめて一定間隔で一括処理する方式。", talkExample: "「夜間バッチで一括要約や分類を回し、朝には結果が出ます。」", businessUse: "大量処理、コスト最適化。" },
  { term: "リアルタイム推論", explanation: "リクエストごとに即座に推論結果を返す方式。", talkExample: "「チャットや検索はリアルタイム推論で、体感速度を重視しています。」", businessUse: "対話、検索、即時判定。" },
  { term: "クラウドAI", explanation: "クラウド上で提供されるAI API・学習・推論サービス。", talkExample: "「クラウドAIなら初期投資を抑えてすぐ試せます。」", businessUse: "スピード、コスト最適化。" },
  { term: "オンプレミス", explanation: "自社のサーバーや設備でシステムを運用すること。", talkExample: "「機密データはオンプレで学習・推論する構成も選べます。」", businessUse: "セキュリティ、ガバナンス。" },
  { term: "ハイブリッド", explanation: "クラウドとオンプレを組み合わせた構成。", talkExample: "「学習はクラウド、推論はオンプレのハイブリッドも可能です。」", businessUse: "バランスの取れた構成。" },
  { term: "SaaS", explanation: "Software as a Service。ネット経由でソフトを利用する形態。", talkExample: "「AI機能もSaaSで提供しているので、導入が早いです。」", businessUse: "提供形態、導入のしやすさ。" },
  { term: "PoC", explanation: "Proof of Concept。実現可能性を小さく検証する試作。", talkExample: "「まずPoCで2週間、御社データで精度を確認しましょう。」", businessUse: "検証、意思決定。" },
  { term: "PoV", explanation: "Proof of Value。ビジネス上の価値を示す検証。", talkExample: "「PoVで工数削減や売上への効果を数値でお見せします。」", businessUse: "投資判断、効果測定。" },
  { term: "データセット", explanation: "学習や評価に使うデータの集合。", talkExample: "「データセットの質と量で、モデルの精度が決まります。」", businessUse: "学習、評価。" },
  { term: "アノテーション", explanation: "データに正解ラベルやタグを付ける作業。", talkExample: "「アノテーションを外注する場合も、品質基準を揃えます。」", businessUse: "教師あり学習の準備。" },
  { term: "教師あり学習", explanation: "正解付きデータで学習する方式。分類・回帰で一般的。", talkExample: "「教師あり学習で、過去の事例から判定ルールを学ばせます。」", businessUse: "分類、予測。" },
  { term: "教師なし学習", explanation: "正解なしでデータの構造やグループを学習する方式。", talkExample: "「教師なしで異常パターンや隠れたセグメントを発見できます。」", businessUse: "クラスタリング、異常検知。" },
  { term: "強化学習", explanation: "報酬を最大化するように試行錯誤で学習する方式。", talkExample: "「強化学習はゲームや推薦の最適化で使われます。」", businessUse: "最適化、戦略学習。" },
  { term: "転移学習", explanation: "別タスクで学習したモデルを、少ないデータで別タスクに活かす手法。", talkExample: "「転移学習で、少量の御社データでも精度を出せます。」", businessUse: "データ不足の補完。" },
  { term: "ハイパーパラメータ", explanation: "学習率や層数など、学習前に人が決めるパラメータ。", talkExample: "「ハイパーパラメータのチューニングで最終精度が変わります。」", businessUse: "モデルチューニング。" },
  { term: "モデル", explanation: "学習の結果得られたパラメータの集合。推論に使う。", talkExample: "「モデルは定期的に再学習して、劣化を防ぎます。」", businessUse: "推論の中心。" },
  { term: "精度", explanation: "正解との一致率や業務指標での良さ。", talkExample: "「精度は検証データで測り、本番でも監視します。」", businessUse: "品質管理。" },
  { term: "再現性", explanation: "同じ条件で同じ結果が得られること。", talkExample: "「プロンプトとバージョンを固定して再現性を確保しています。」", businessUse: "品質、監査。" },
  { term: "スケーラビリティ", explanation: "負荷やデータ量が増えても対応できる拡張性。", talkExample: "「利用が増えてもスケールできる設計にしています。」", businessUse: "成長対応。" },
  { term: "レイテンシ", explanation: "リクエストから応答までの遅延時間。", talkExample: "「レイテンシを抑えて、体感速度を重視しています。」", businessUse: "UX、SLA。" },
  { term: "スループット", explanation: "単位時間あたりに処理できるリクエスト数。", talkExample: "「スループットを確保して、ピーク時も落ちません。」", businessUse: "容量設計。" },
  { term: "コスト最適化", explanation: "API料金やGPU利用を抑えつつ品質を維持すること。", talkExample: "「キャッシュやバッチでコストを最適化しています。」", businessUse: "TCO削減。" },
  { term: "セキュリティ", explanation: "データやAPIの機密性・改ざん防止・アクセス制御。", talkExample: "「機密データは暗号化し、APIは認証必須にしています。」", businessUse: "リスク対策。" },
  { term: "ガバナンス", explanation: "AIの利用方針・倫理・監査を組織で管理すること。", talkExample: "「ガバナンスで利用範囲とログを明確にしています。」", businessUse: "コンプライアンス。" },
  { term: "説明可能性", explanation: "AIの判断理由を人に説明できる性質。", talkExample: "「重要判断は説明可能性の高い手法を選んでいます。」", businessUse: "信頼、監査。" },
  { term: "バイアス", explanation: "学習データに含まれる偏りが、出力に不公平を生むこと。", talkExample: "「データと評価でバイアスをチェックしています。」", businessUse: "公平性、倫理。" },
  { term: "倫理", explanation: "AIの利用が社会や個人に与える影響を考慮した考え方。", talkExample: "「倫理ガイドラインに沿って利用範囲を決めています。」", businessUse: "持続可能な活用。" },
  { term: "DX", explanation: "Digital Transformation。デジタルで業務や価値を変革すること。", talkExample: "「AIはDXの一環として、業務効率と意思決定を変えます。」", businessUse: "変革、競争力。" },
  { term: "自動化", explanation: "人が行っていた作業をシステムに任せること。", talkExample: "「定型作業を自動化して、人が判断に集中できるようにします。」", businessUse: "効率化、属人解消。" },
  { term: "ワークフロー", explanation: "業務の流れを定義した手順。AIで一部を自動化できる。", talkExample: "「ワークフローにAIを組み込んで、承認前の下書きを自動化できます。」", businessUse: "業務設計。" },
  { term: "インテグレーション", explanation: "複数システムを連携させて一つの流れにすること。", talkExample: "「既存のCRMやSFAとインテグレーションして使えます。」", businessUse: "連携、効率化。" },
  { term: "カスタマイズ", explanation: "御社のデータやルールに合わせて仕様を調整すること。", talkExample: "「用語やフォーマットはカスタマイズで御社仕様に合わせます。」", businessUse: "自社フィット。" },
  { term: "サンドボックス", explanation: "本番と隔離した検証環境。安全に試せる。", talkExample: "「サンドボックスで動作確認してから本番に反映できます。」", businessUse: "安全な検証。" },
  { term: "ログ", explanation: "処理内容や結果を記録したデータ。監査や障害調査に使う。", talkExample: "「入出力はログに残し、トラブル時に追えるようにしています。」", businessUse: "監査、障害対応。" },
  { term: "監視", explanation: "稼働状況や精度を継続的に見て、異常を検知すること。", talkExample: "「精度とレイテンシを監視し、劣化時にアラートを出します。」", businessUse: "安定運用。" },
  { term: "バージョン管理", explanation: "モデルやプロンプトの版を管理し、切り戻しを可能にすること。", talkExample: "「プロンプトもバージョン管理して、問題時は即戻せます。」", businessUse: "安全な変更。" },
  { term: "フェイルセーフ", explanation: "障害時に安全側に振る舞う設計。", talkExample: "「API障害時はフェイルセーフで従来フローに切り替えます。」", businessUse: "信頼性。" },
];

/** 日付をシードに日替わりで1件返す（営業で使いやすいAI用語）。0件時は安全のためデフォルトを返す。 */
export function getTodaysAiTerm(): AiTermEntry {
  if (!TERMS || TERMS.length === 0) {
    return { term: "—", explanation: "—", talkExample: "—", businessUse: "—" };
  }
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dayOfYear = Math.floor(
    (jst.getTime() - new Date(jst.getUTCFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const index = Math.abs(dayOfYear) % TERMS.length;
  const item = TERMS[index];
  return item ?? TERMS[0];
}
