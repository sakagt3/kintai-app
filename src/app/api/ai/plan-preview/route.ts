/**
 * AI学習プラン・プレビュー（ストリーミング）。
 * 学習目標とレベルに応じて「明日のクイズ3問」と「ニュース解説サンプル」を生成。
 * OPENAI_API_KEY 未設定時はモックストリームを返す。
 */
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

const LEVEL_PROMPTS: Record<string, string> = {
  beginner:
    "初心者向け：専門用語は最小限にし、平易な言葉で短く説明する。一文は短く。",
  intermediate:
    "中級者向け：基本的な専門用語は使ってよい。解説は2〜3文で要点を押さえる。",
  advanced:
    "上級者向け：専門用語を適度に使い、背景やトレードオフにも触れる。",
  pro: "プロ向け：業界標準の用語と深い技術的解説。簡潔だが情報密度を高く。",
};

function buildPrompt(goal: string, level: string, contentFocus: string): string {
  const levelGuide = LEVEL_PROMPTS[level] ?? LEVEL_PROMPTS.intermediate;
  const isQuiz = contentFocus === "quiz";
  const formatSection = isQuiz
    ? `【出力形式】（この形式で必ず書いてください。見出しはそのまま使うこと）
## 明日出すクイズ 5問（4択形式で問題文のみ、番号付き）
1. （問題文）
2. （問題文）
3. （問題文）
4. （問題文）
5. （問題文）

## ニュース解説サンプル（1文で簡潔に）
（1文で要点のみ）`
    : `【出力形式】（この形式で必ず書いてください。見出しはそのまま使うこと）
## 明日出すクイズ 2問（4択形式で問題文のみ、番号付き）
1. （問題文）
2. （問題文）

## ニュース解説サンプル（今日のAIニュースを想定した詳細解説）
（4〜5文で、レベルに合わせた深さで背景・トレードオフにも触れる）`;

  return `あなたは学習コンシェルジュです。ユーザーの学習目標に沿って、以下の2つを生成してください。

【学習目標】
${goal || "（未設定・汎用ビジネス教養）"}

【レベル指示】
${levelGuide}

${formatSection}`;
}

function mockStream(goal: string, level: string, contentFocus: string): ReadableStream<Uint8Array> {
  const isQuiz = contentFocus === "quiz";
  const quizPart = isQuiz
    ? `## 明日出すクイズ 5問（4択形式で問題文のみ、番号付き）
1. 「RAG」の「R」は何の略？（A: Retrieval B: Real-time C: Random D: Resource）
2. LLMが事実でない内容を生成する現象を何という？（A: Bug B: Hallucination C: Noise D: Drift）
3. テキストをベクトルに変換する処理は？（A: Tokenize B: Embedding C: Encode D: Hash）
4. 既存LLMを自社データで追加学習させることは？（A: Tuning B: Fine-tuning C: Training D: Adapting）
5. 目標に向けてツールを組み合わせて実行するAIの形態は？（A: Bot B: Agent C: Pipeline D: Workflow）

## ニュース解説サンプル（1文で簡潔に）
RAGの実務導入が進み、社内ナレッジ検索の標準になりつつあります。`
    : `## 明日出すクイズ 2問（4択形式で問題文のみ、番号付き）
1. 「RAG」の「R」は何の略？（A: Retrieval B: Real-time C: Random D: Resource）
2. LLMが事実でない内容を生成する現象を何という？（A: Bug B: Hallucination C: Noise D: Drift）

## ニュース解説サンプル（今日のAIニュースを想定した詳細解説）
${level === "beginner" ? "AIのニュースでは、会社の資料を検索して答えを作る「RAG」というやり方が広がっています。覚え違いを減らせるので、お客様への説明にも使えます。まずは社内FAQから試すと導入しやすいです。" : "RAG（検索拡張生成）の実務導入が進み、社内ナレッジ検索の標準になりつつあります。LLM単体より hallucination を抑えつつ根拠付き回答が可能で、PoC から本番運用への移行が増えています。Embedding とチャンク設計が精度を左右するため、ドメインを絞った検証がおすすめです。"}

（※ OPENAI_API_KEY を設定すると、あなたの目標に合わせた内容がリアルタイムで生成されます）`;
  const text = quizPart;

  let i = 0;
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const send = () => {
        if (i >= text.length) {
          controller.close();
          return;
        }
        const chunk = text.slice(i, Math.min(i + 2, text.length));
        i += chunk.length;
        controller.enqueue(encoder.encode(chunk));
        setTimeout(send, 20);
      };
      setTimeout(send, 100);
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const goal = typeof body.goal === "string" ? body.goal.trim() : "";
    const level =
      typeof body.level === "string" &&
      ["beginner", "intermediate", "advanced", "pro"].includes(body.level)
        ? body.level
        : "intermediate";
    const contentFocus =
      body.contentFocus === "topic" ? "topic" : "quiz";

    if (!process.env.OPENAI_API_KEY) {
      const stream = mockStream(goal, level, contentFocus);
      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = buildPrompt(goal, level, contentFocus);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxOutputTokens: 800,
    });

    return result.toTextStreamResponse({
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "プラン生成に失敗しました。" },
      { status: 500 }
    );
  }
}
