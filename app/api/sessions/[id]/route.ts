import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildTree } from "@/lib/tree";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "Sessiya topilmadi" }, { status: 404 });
  return NextResponse.json({ session, tree: await buildTree(id) });
}

/** Sessiya holatini yangilash: bosqich, yakuniy o'z-o'zini baholash (5-bo'lim). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { stage?: string; reflection?: string; finish?: boolean };

  const session = await prisma.session.update({
    where: { id },
    data: {
      stage: body.stage,
      reflection: body.reflection,
      finishedAt: body.finish ? new Date() : undefined,
    },
  });
  return NextResponse.json({ session });
}
