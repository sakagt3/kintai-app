/**
 * 1分クイック診断: 3問の回答からAIがレベルを推定し「君は〇〇だね。このプランはどう？」と提案。
 */
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getQuestionById } from "@/lib/quizBank";

type Answer = { questionId: string; selectedIndex: number };

function buildPrompt(answers: Answer[]): string {
  const parts = answers.map((a, i) => {
    const q = getQuestionById(a.questionId);
    const correct = q ? a.selectedIndex === q.correctIndex : false;
    return `問${i + 1}: ${q?.question ?? a.questionId} → ${correct ? "正解" : "不正解"}`;
  });
  const correctCount = answers.filter((a) => {
    const q = getQuestionById(a.questionId);
    return q && a.selectedIndex === q.correctIndex;
  }).length;

  return `以下の3問のクイック診断結果を元に、ユーザーのレベルを「初心者」「中級者」「上級者」「プロ」のいずれか1つで判定し、そのレベルに合った学習プランを1〜2文で提案してください。親しみやすい口調で「君は〇〇だね。このプランはどう？」のように締めてください。

【診断結果】
${parts.join("\n")}
正解数: ${correctCount} / 3

【出力】
レベルと、その後の1〜2文のプラン提案のみ。見出しは不要。`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const answers = body.answers as Answer[] | undefined;
    if (!Array.isArray(answers) || answers.length !== 3) {
      return NextResponse.json(
        { error: "answers に3問分の { questionId, selectedIndex } を指定してください。" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      const correctCount = answers.filter((a) => {
        const q = getQuestionById(a.questionId);
        return q && a.selectedIndex === q.correctIndex;
      }).length;
      const level =
        correctCount >= 3 ? "上級者" : correctCount >= 2 ? "中級者" : correctCount >= 1 ? "初心者" : "初心者";
      return NextResponse.json({
        level,
        message: `君は${level}だね。毎日少しずつクイズとニュースで慣らしていこう。このプランはどう？`,
      });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: buildPrompt(answers),
      maxOutputTokens: 300,
    });

    const levelMatch = text.match(/初心者|中級者|上級者|プロ/);
    return NextResponse.json({
      level: levelMatch ? levelMatch[0] : "中級者",
      message: text.trim(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "診断に失敗しました。" },
      { status: 500 }
    );
  }
}
