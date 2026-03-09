/**
 * 営業トーク・シミュレーター: クイズの知識を「15秒で客先に説明」した内容をAIがフィードバック。
 */
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const concept = typeof body.concept === "string" ? body.concept.trim() : "";
    const userExplanation = typeof body.userExplanation === "string" ? body.userExplanation.trim() : "";

    if (!concept || !userExplanation) {
      return NextResponse.json(
        { error: "concept と userExplanation を指定してください。" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        feedback: "この知識を、お客様には「要点を絞って・専門用語は補足付きで」説明すると伝わりやすいです。OPENAI_API_KEY を設定すると、あなたの説明文に合わせた具体的なフィードバックが得られます。",
      });
    }

    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `あなたは営業研修の講師です。以下の「学んだ概念」について、ユーザーが客先で15秒で説明する想定で書いた文章を読んで、簡潔にフィードバックしてください（2〜4文）。良い点を1つ褒め、改善点を1つ具体的に示すこと。

【学んだ概念】
${concept}

【ユーザーが書いた説明】
${userExplanation}

【フィードバック】
`,
      maxOutputTokens: 300,
    });

    return NextResponse.json({ feedback: text.trim() });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "フィードバックの生成に失敗しました。" },
      { status: 500 }
    );
  }
}
