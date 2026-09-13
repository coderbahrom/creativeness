import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, roleAllows, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Dars ekrani uchun jonli holat (9.1-bo'lim).
 * O'qituvchi dars vaqtida kim ishlayotganini, kim qotib qolganini ko'radi.
 *
 * Yengil bo'lishi kerak — har bir necha soniyada so'raladi.
 */
export async function GET(request: Request) {
  const jar = await cookies();
  const role = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!roleAllows(role, "oqituvchi")) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classroomId = searchParams.get("sinf");
  if (!classroomId) return NextResponse.json({ error: "Sinf ko'rsatilmagan" }, { status: 400 });

  // Bugungi sessiyalar
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const students = await prisma.student.findMany({
    where: { classroomId },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastInitial: true,
      sessions: {
        where: { startedAt: { gte: since } },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          id: true,
          stage: true,
          startedAt: true,
          finishedAt: true,
          story: { select: { title: true } },
          responses: {
            orderBy: { createdAt: "desc" },
            select: {
              createdAt: true,
              assessment: { select: { safetyFlagged: true } },
            },
          },
        },
      },
    },
  });

  const now = Date.now();
  const rows = students.map((student) => {
    const session = student.sessions[0];
    const lastAt = session?.responses[0]?.createdAt ?? session?.startedAt ?? null;
    const idleMinutes = lastAt ? Math.floor((now - new Date(lastAt).getTime()) / 60000) : null;

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastInitial}.`,
      started: Boolean(session),
      stage: session?.stage ?? null,
      storyTitle: session?.story.title ?? null,
      finished: Boolean(session?.finishedAt),
      responseCount: session?.responses.length ?? 0,
      flagged: session?.responses.some((r) => r.assessment?.safetyFlagged) ?? false,
      idleMinutes,
    };
  });

  return NextResponse.json({ rows, at: new Date().toISOString() });
}
