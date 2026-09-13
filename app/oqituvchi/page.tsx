import Link from "next/link";
import { logout } from "@/app/kirish/actions";
import { AppHeader } from "@/components/AppHeader";
import { CRITERIA, averageLevels, roundLevels } from "@/lib/analytics";
import { LevelChip } from "@/components/LevelChip";
import { prisma } from "@/lib/db";
import { CRITERION_SHORT } from "@/lib/torrance";

export const dynamic = "force-dynamic";

export default async function TeacherHome() {
  const classrooms = await prisma.classroom.findMany({
    orderBy: { grade: "asc" },
    include: {
      _count: { select: { students: true } },
      students: {
        select: {
          sessions: {
            select: {
              startedAt: true,
              storyId: true,
              responses: { select: { assessment: true } },
            },
          },
        },
      },
    },
  });

  const cards = classrooms.map((classroom) => {
    const sessions = classroom.students.flatMap((s) => s.sessions);
    const assessments = sessions
      .flatMap((s) => s.responses.map((r) => r.assessment))
      .filter(Boolean) as never[];
    const responseCount = sessions.reduce((sum, s) => sum + s.responses.length, 0);
    const flagged = sessions
      .flatMap((s) => s.responses)
      .filter((r) => r.assessment?.safetyFlagged).length;
    const lastAt = sessions.reduce<Date | null>(
      (latest, s) => (!latest || s.startedAt > latest ? s.startedAt : latest),
      null,
    );

    return {
      id: classroom.id,
      name: classroom.name,
      grade: classroom.grade,
      students: classroom._count.students,
      storyCount: new Set(sessions.map((s) => s.storyId)).size,
      responseCount,
      flagged,
      lastAt,
      levels: roundLevels(averageLevels(assessments)),
    };
  });

  const totalFlagged = cards.reduce((sum, c) => sum + c.flagged, 0);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">O&apos;qituvchi paneli</h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              Sinfni oching — o&apos;quvchilar 4 mezon bo&apos;yicha, ertaklar bo&apos;yicha
              ajratilgan holda ko&apos;rinadi.
            </p>
          </div>
          <Link
            href="/oqituvchi/moslik"
            className="ml-auto btn btn-quiet px-4 py-1.5 text-sm"
          >
            AI va pedagog mosligi
          </Link>
          <form action={logout}>
            <button type="submit" className="btn btn-quiet px-4 py-1.5 text-sm">
              Chiqish
            </button>
          </form>
        </div>

        {totalFlagged > 0 && (
          <p className="mt-6 rounded-xl border border-[var(--warn)] bg-[var(--surface)] px-4 py-3 font-bold text-[var(--warn)]">
            {totalFlagged} ta javob alohida belgilangan — ular ballanmadi va ko&apos;rib
            chiqishingizni kutmoqda.
          </p>
        )}

        <ul className="mt-8 space-y-3">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/oqituvchi/${card.id}`}
                className="card block p-5 transition hover:-translate-y-0.5 hover:border-[var(--leaf)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div>
                    <p className="text-lg font-extrabold">{card.name}</p>
                    <p className="mt-1 text-sm text-[var(--ink-soft)]">
                      {card.students} o&apos;quvchi · {card.grade}-sinf normasi ·{" "}
                      {card.storyCount} ertak · {card.responseCount} javob
                    </p>
                    {card.lastAt && (
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        Oxirgi dars:{" "}
                        {new Date(card.lastAt).toLocaleDateString("uz-UZ", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    )}
                    {card.flagged > 0 && (
                      <p className="mt-1 text-sm font-bold text-[var(--warn)]">
                        {card.flagged} ta belgilangan javob
                      </p>
                    )}
                  </div>

                  {card.levels ? (
                    <div className="flex gap-2">
                      {CRITERIA.map((criterion) => (
                        <div key={criterion} className="text-center">
                          <LevelChip level={card.levels![criterion]} />
                          <p className="mt-1 text-[11px] font-bold text-[var(--ink-soft)]">
                            {CRITERION_SHORT[criterion]}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--ink-soft)]">Hali baholangan javob yo&apos;q</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
          {cards.length === 0 && (
            <li className="card p-6 text-[var(--ink-soft)]">
              Hali sinf yo&apos;q. Admin panelida sinf va o&apos;quvchi qo&apos;shing.
            </li>
          )}
        </ul>
      </main>
    </>
  );
}
