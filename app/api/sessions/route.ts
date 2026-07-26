import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { studentId, storyId } = (await request.json()) as {
    studentId?: string;
    storyId?: string;
  };
  if (!studentId || !storyId) {
    return NextResponse.json({ error: "studentId va storyId kerak" }, { status: 400 });
  }

  const open = await prisma.session.findFirst({
    where: { studentId, storyId, finishedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (open) return NextResponse.json({ id: open.id, resumed: true });

  const session = await prisma.session.create({ data: { studentId, storyId } });
  return NextResponse.json({ id: session.id, resumed: false });
}
