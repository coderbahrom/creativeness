import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LevelChip } from "@/components/LevelChip";
import { CRITERIA, averageLevels, roundLevels, type Levels } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { CALIBRATION, CRITERION_HINTS, CRITERION_LABELS, clampGrade } from "@/lib/torrance";

export const dynamic = "force-dynamic";

export default async function ClassroomMap({
  params,
  searchParams,
}: {
  params: Promise<{ classroomId: string }>;
  searchParams: Promise<{ ertak?: string }>;
}) {
  const { classroomId } = await params;
  const { ertak } = await searchParams;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      students: {
        orderBy: { firstName: "asc" },
        include: {
          sessions: {
            include: {
              story: { select: { id: true, title: true } },
              responses: { include: { assessment: true } },
            },
          },
        },
      },
    },
  });
  if (!classroom) notFound();

  // Sinf ishlagan ertaklar ro'yxati — filtr uchun
  const storyMap = new Map<string, { id: string; title: string; responses: number }>();
  for (const student of classroom.students) {
    for (const session of student.sessions) {
      const entry = storyMap.get(session.storyId) ?? {
        id: session.storyId,
        title: session.story.title,
        responses: 0,
      };
      entry.responses += session.responses.length;
      storyMap.set(session.storyId, entry);
    }
  }
  const stories = [...storyMap.values()].sort((a, b) => b.responses - a.responses);
  const activeStory = ertak && storyMap.has(ertak) ? storyMap.get(ertak)! : null;

  type Row = {
    id: string;
    name: string;
    responseCount: number;
    flagged: boolean;
    edited: boolean;
    levels: Levels | null;
  };

  const rows: Row[] = classroom.students.map((student) => {
    const sessions = activeStory
      ? student.sessions.filter((s) => s.storyId === activeStory.id)
      : student.sessions;
    const responses = sessions.flatMap((s) => s.responses);
    const assessments = responses.map((r) => r.assessment).filter(Boolean) as never[];

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastInitial}.`,
      responseCount: responses.length,
      flagged: responses.some((r) => r.assessment?.safetyFlagged),
      edited: responses.some((r) => r.assessment?.teacherEdited),
      levels: roundLevels(averageLevels(assessments)),
    };
  });

  const active = rows.filter((row) => row.levels);
  const classAvg = averageLevels(
    classroom.students
      .flatMap((s) =>
        (activeStory ? s.sessions.filter((x) => x.storyId === activeStory.id) : s.sessions).flatMap(
          (x) => x.responses.map((r) => r.assessment),
        ),
      )
      .filter(Boolean) as never[],
  );

  const weakest = classAvg
    ? [...CRITERIA].sort((a, b) => classAvg[a] - classAvg[b])[0]
    : null;
  const calibration = CALIBRATION[clampGrade(classroom.grade)];
  const silent = rows.filter((row) => row.responseCount === 0);
  const flaggedCount = rows.filter((row) => row.flagged).length;

  /** Filtr faol bo'lsa, o'quvchi ustiga bosilganda o'sha ertak sahifasi ochiladi */
  const rowHref = (id: string) =>
    activeStory
      ? `/oqituvchi/oquvchi/${id}/ertak/${activeStory.id}`
      : `/oqituvchi/oquvchi/${id}`;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Breadcrumb
          items={[{ href: "/oqituvchi", label: "Sinflar" }, { label: classroom.name }]}
        />

        <header className="mt-4">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{classroom.name}</h1>
          <p className="mt-1 text-[var(--ink-soft)]">
            {classroom.students.length} o&apos;quvchi · {classroom.grade}-sinf normasi:{" "}
            {calibration.fluency.min}–{calibration.fluency.max} g&apos;oya,{" "}
            {calibration.flexibility.min}–{calibration.flexibility.max} toifa,{" "}
            {calibration.elaboration.min}–{calibration.elaboration.max} tafsilot
          </p>
        </header>

        {flaggedCount > 0 && (
          <p className="mt-5 rounded-xl border border-[var(--warn)] bg-[var(--surface)] px-4 py-3 font-bold text-[var(--warn)]">
            {flaggedCount} o&apos;quvchida belgilangan javob bor — ko&apos;rib chiqishingiz kerak.
          </p>
        )}

        {stories.length > 0 && (
          <nav aria-label="Ertak bo'yicha filtr" className="mt-7">
            <p className="mb-2 text-sm font-bold text-[var(--ink-soft)]">Ertak bo&apos;yicha</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/oqituvchi/${classroom.id}`}
                aria-current={!activeStory ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  !activeStory
                    ? "bg-[var(--btn-bg)] text-[var(--btn-ink)]"
                    : "border border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--leaf)] hover:text-[var(--ink)]"
                }`}
              >
                Barcha ertaklar
              </Link>
              {stories.map((story) => {
                const on = activeStory?.id === story.id;
                return (
                  <Link
                    key={story.id}
                    href={`/oqituvchi/${classroom.id}?ertak=${story.id}`}
                    aria-current={on ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      on
                        ? "bg-[var(--btn-bg)] text-[var(--btn-ink)]"
                        : "border border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--leaf)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {story.title}
                    <span className={on ? "ml-2 opacity-80" : "ml-2 opacity-70"}>
                      {story.responses}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}

        <section className="mt-6">
          <div className="overflow-x-auto rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-sm text-[var(--ink-soft)]">
                  <th className="px-5 py-3 font-bold">O&apos;quvchi</th>
                  {CRITERIA.map((criterion) => (
                    <th
                      key={criterion}
                      className="px-3 py-3 text-center font-bold"
                      title={CRITERION_HINTS[criterion]}
                    >
                      {CRITERION_LABELS[criterion]}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right font-bold">Javoblar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface-sunk)]"
                  >
                    <td className="px-5 py-2.5">
                      <Link href={rowHref(row.id)} className="font-bold hover:underline">
                        {row.name}
                      </Link>
                      {row.flagged && (
                        <span className="ml-2 text-xs font-bold text-[var(--warn)]">
                          ● ko&apos;rib chiqing
                        </span>
                      )}
                      {row.edited && (
                        <span className="ml-2 text-xs text-[var(--ink-soft)]">tahrirlangan</span>
                      )}
                    </td>
                    {CRITERIA.map((criterion) => (
                      <td key={criterion} className="px-3 py-2.5 text-center">
                        <LevelChip level={row.levels?.[criterion] ?? 0} />
                      </td>
                    ))}
                    <td className="px-5 py-2.5 text-right text-sm text-[var(--ink-soft)]">
                      {row.responseCount || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              {classAvg && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--line-strong)] bg-[var(--surface-sunk)]">
                    <td className="px-5 py-3 font-extrabold">Sinf o&apos;rtachasi</td>
                    {CRITERIA.map((criterion) => (
                      <td key={criterion} className="px-3 py-3 text-center font-bold">
                        {classAvg[criterion].toFixed(1)}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-right text-sm text-[var(--ink-soft)]">
                      {active.length} ta faol
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <section className="card mt-8 space-y-3 p-5">
          <h2 className="font-extrabold">
            Sinf manzarasi{activeStory ? ` — ${activeStory.title}` : ""}
          </h2>
          {weakest && classAvg ? (
            <p className="text-[var(--ink-soft)]">
              Eng past ko&apos;rsatkich:{" "}
              <strong className="text-[var(--ink)]">{CRITERION_LABELS[weakest]}</strong>{" "}
              (o&apos;rtacha {classAvg[weakest].toFixed(1)}). Keyingi darsda shu mezonni
              faollashtiradigan topshiriq tanlang.
            </p>
          ) : (
            <p className="text-[var(--ink-soft)]">
              Hali baholangan javob yo&apos;q — o&apos;quvchilar darsni boshlagach bu yerda
              manzara paydo bo&apos;ladi.
            </p>
          )}
          {silent.length > 0 && (
            <p className="text-[var(--ink-soft)]">
              {activeStory ? "Bu ertakda" : "Hali"} javob bermaganlar:{" "}
              {silent.map((row) => row.name).join(", ")}.
            </p>
          )}
          <p className="text-sm text-[var(--ink-soft)]">
            Darajalar: 4 — yosh normasidan yuqori, 3 — normaga mos, 2 — biroz past, 1 —
            qo&apos;llab-quvvatlash kerak. Aniq raqam emas, daraja beriladi: AI o&apos;zbekcha
            bolalar nutqini 100% aniq tahlil qila olmaydi, shuning uchun har bir bahoni
            o&apos;zgartira olasiz.
          </p>
        </section>
      </main>
    </>
  );
}
