import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CERO_RATINGS = ["A", "B", "C", "D", "Z"] as const;
type CeroRating = (typeof CERO_RATINGS)[number];

interface MediaInput {
  type: string;
  filename: string;
  url: string;
}

async function generateSearchVector(
  gameTitle: string,
  caseTitle: string,
  summary: string
): Promise<string | null> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `以下のCERO審査事例について、主要な表現・内容カテゴリを50個の数値（0.0〜1.0）で表してください。JSON配列のみ返してください。
タイトル: ${gameTitle} / 事例: ${caseTitle} / 概要: ${summary.substring(0, 200)}`,
        },
      ],
    });
    const text =
      response.content[0].type === "text" ? response.content[0].text : "[]";
    const match = text.match(/\[[\d.,\s]+\]/);
    if (match) return match[0];
  } catch {
    // ignore
  }
  return null;
}

// GET /api/cases
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rating = searchParams.get("rating");

  const where =
    rating && CERO_RATINGS.includes(rating as CeroRating)
      ? { ceroRating: rating }
      : {};

  const cases = await prisma.case.findMany({
    where,
    include: { media: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cases);
}

// POST /api/cases
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviewNumber, gameTitle, caseTitle, summary, ceroRating, media } =
      body as {
        reviewNumber: string;
        gameTitle: string;
        caseTitle: string;
        summary: string;
        ceroRating: string;
        media?: MediaInput[];
      };

    if (!reviewNumber || !gameTitle || !caseTitle || !summary || !ceroRating) {
      return NextResponse.json(
        { error: "必須フィールドが不足しています" },
        { status: 400 }
      );
    }

    if (!CERO_RATINGS.includes(ceroRating as CeroRating)) {
      return NextResponse.json(
        { error: "無効なCEROレーティングです (A/B/C/D/Z)" },
        { status: 400 }
      );
    }

    const searchVector = await generateSearchVector(
      gameTitle,
      caseTitle,
      summary
    );

    const newCase = await prisma.case.create({
      data: {
        reviewNumber,
        gameTitle,
        caseTitle,
        summary,
        ceroRating,
        searchVector,
        ...(media && media.length > 0
          ? {
              media: {
                create: media.map((m) => ({
                  type: m.type,
                  filename: m.filename,
                  url: m.url,
                })),
              },
            }
          : {}),
      },
      include: { media: true },
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "この審査番号は既に登録されています" },
        { status: 409 }
      );
    }
    console.error("Case creation error:", error);
    return NextResponse.json({ error: "内部サーバーエラー" }, { status: 500 });
  }
}
