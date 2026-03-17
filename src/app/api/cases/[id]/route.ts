import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const caseData = await prisma.case.findUnique({
    where: { id: parseInt(id) },
    include: { media: true },
  });

  if (!caseData) {
    return NextResponse.json({ error: "事例が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(caseData);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.case.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
