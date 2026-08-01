import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, roleAllows, verifyToken } from "@/lib/auth";

/**
 * O'qituvchi har qanday bahoni bir bosishda o'zgartira oladi (9.5-bo'lim).
 * Bu majburiy funksiya — usiz o'qituvchi tizimga ishonmaydi.
 * O'zgartirilgan baho keyingi avtomatik qayta hisoblashlarda saqlanib qoladi.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Baho tahriri — faqat o'qituvchi/admin. O'quvchi oqimi bu yo'lni ishlatmaydi.
  const jar = await cookies();
  const role = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!roleAllows(role, "oqituvchi")) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    fluency?: number;
    flexibility?: number;
    originality?: number;
    elaboration?: number;
    teacherNote?: string;
    safetyResolved?: boolean;
  };

  const level = (value: number | undefined) =>
    value === undefined ? undefined : Math.min(4, Math.max(1, Math.round(value)));

  const assessment = await prisma.assessment.update({
    where: { id },
    data: {
      fluency: level(body.fluency),
      flexibility: level(body.flexibility),
      originality: level(body.originality),
      elaboration: level(body.elaboration),
      teacherNote: body.teacherNote,
      safetyFlagged: body.safetyResolved ? false : undefined,
      teacherEdited: true,
    },
  });

  return NextResponse.json({ assessment });
}
