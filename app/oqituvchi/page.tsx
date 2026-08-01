import Link from "next/link";
import { logout } from "@/app/kirish/actions";
import { AppHeader } from "@/components/AppHeader";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TeacherHome() {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { grade: "asc" },
    include: { _count: { select: { students: true } } },
  });

  const flagged = await prisma.assessment.count({ where: { safetyFlagged: true } });

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-extrabold">O&apos;qituvchi paneli</h1>
        <form action={logout} className="ml-auto">
          <button type="submit" className="btn btn-quiet px-4 py-1.5 text-sm">
            Chiqish
          </button>
        </form>
      </div>
      <p className="mt-2 text-[var(--ink-soft)]">
        Sinf xaritasi 4 mezon bo&apos;yicha darajalarni ko&apos;rsatadi. Har bir bahoni
        o&apos;zgartirish mumkin.
      </p>

      {flagged > 0 && (
        <p className="mt-4 rounded-lg border border-[var(--warn)] bg-[var(--paper-raised)] px-4 py-3 text-[var(--warn)]">
          {flagged} ta javob alohida belgilangan — ular ballanmadi va ko&apos;rib chiqishni kutmoqda.
        </p>
      )}

      <ul className="mt-8 space-y-3">
        {classrooms.map((classroom) => (
          <li key={classroom.id}>
            <Link
              href={`/oqituvchi/${classroom.id}`}
              className="card flex items-center justify-between p-5 transition hover:border-[var(--leaf-deep)]"
            >
              <span className="font-bold">{classroom.name}</span>
              <span className="text-sm text-[var(--ink-soft)]">
                {classroom._count.students} o&apos;quvchi · {classroom.grade}-sinf normasi
              </span>
            </Link>
          </li>
        ))}
      </ul>
      </main>
    </>
  );
}
