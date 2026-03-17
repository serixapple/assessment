import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// POST /api/search — natural language search using Claude
export async function POST(request: Request) {
  try {
    const { query, rating } = await request.json();

    if (!query || query.trim() === "") {
      return NextResponse.json({ error: "検索クエリを入力してください" }, { status: 400 });
    }

    // 1. Fetch all cases (with optional rating filter)
    const where = rating ? { ceroRating: rating } : {};
    const allCases = await prisma.case.findMany({
      where,
      include: { media: true },
      orderBy: { createdAt: "desc" },
    });

    if (allCases.length === 0) {
      return NextResponse.json({ results: [], explanation: "登録された事例がありません。" });
    }

    // 2. Use Claude to analyze query and rank cases
    const casesSummary = allCases.map((c, i) =>
      `[${i}] 審査番号:${c.reviewNumber} タイトル:${c.gameTitle} 事例:${c.caseTitle}\n概要:${c.summary}`
    ).join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `あなたはCEROゲーム審査の専門家です。以下の事例リストから、検索クエリに最も関連する事例を見つけてください。

検索クエリ: "${query}"

事例リスト:
${casesSummary}

上記の事例の中から、検索クエリと意味的に似ている事例のインデックス番号（[0],[1],...）を関連度の高い順に最大5つ選び、
なぜ関連しているかの説明とともにJSON形式で返してください。

回答形式:
{
  "results": [
    {"index": 0, "reason": "説明"},
    {"index": 2, "reason": "説明"}
  ],
  "explanation": "検索結果の全体的な説明"
}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";

    // Parse JSON from Claude response
    let parsed: { results: Array<{ index: number; reason: string }>; explanation: string } = {
      results: [],
      explanation: "",
    };
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    } catch {
      // fallback to returning all cases
      return NextResponse.json({
        results: allCases.slice(0, 5).map((c) => ({ case: c, reason: "" })),
        explanation: "検索結果を取得しました。",
      });
    }

    const results = (parsed.results || [])
      .filter((r) => r.index >= 0 && r.index < allCases.length)
      .map((r) => ({
        case: allCases[r.index],
        reason: r.reason,
      }));

    return NextResponse.json({
      results,
      explanation: parsed.explanation || "",
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "検索中にエラーが発生しました" }, { status: 500 });
  }
}
