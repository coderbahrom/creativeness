import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CriterionCard } from "@/components/CriterionCard";
import { LevelChip } from "@/components/LevelChip";
import {
  CRITERIA,
  averageLevels,
  roundLevels,
  scorable,
  totalLevel,
  trendOf,
  type Levels,
} from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { CALIBRATION, CRITERION_SHORT, clampGrade } from "@/lib/torrance";

export const dynamic = "force-dynamic";

export default async function StudentProfile({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      classroom: true,
      sessions: {
        orderBy: { startedAt: "asc" },
        include: {
          story: { select: { id: true, title: true } },
          responses: {
            orderBy: { createdAt: "asc" },
            include: { assessment: true, task: true },
          },
        },
      },
    },
  });
  if (!student) notFound();

  const name = `${student.firstName} ${student.lastInitial}.`;

  /** Ertak bo'yicha guruhlash — bitta ertakda bir necha sessiya bo'lishi mumkin */
  type StoryGroup = {
    storyId: string;
    title: string;
    firstAt: Date;
    lastAt: Date;
    responseCount: number;
    flaggedCount: number;
    editedCount: number;
    levels: Levels | null;
    sessionIds: string[];
  };

  const byStory = new Map<string, StoryGroup>();
  for (const session of student.sessions) {
    const key = session.storyId;
    const group = byStory.get(key) ?? {
      storyId: key,
      title: session.story.title,
      firstAt: session.startedAt,
      lastAt: session.startedAt,
      responseCount: 0,
      flaggedCount: 0,
      editedCount: 0,
      levels: null,
      sessionIds: [],
    };
    group.lastAt = session.startedAt > group.lastAt ? session.startedAt : group.lastAt;
    group.sessionIds.push(session.id);
    group.responseCount += session.responses.length;
    group.flaggedCount += session.responses.filter((r) => r.assessment?.safetyFlagged).length;
    group.editedCount += session.responses.filter((r) => r.assessment?.teacherEdited).length;
    byStory.set(key, group);
  }

  // Har bir ertak uchun o'rtacha daraja
  for (const group of byStory.values()) {
    const assessments = student.sessions
      .filter((s) => s.storyId === group.storyId)
      .flatMap((s) => s.responses.map((r) => r.assessment));
    group.levels = roundLevels(averageLevels(assessments.filter(Boolean) as never[]));
  }

  const stories = [...byStory.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  const allAssessments = student.sessions
    .flatMap((s) => s.responses.map((r) => r.assessment))
    .filter(Boolean) as never[];
  const overall = averageLevels(allAssessments);
  const overallRounded = roundLevels(overall);
  const scoredCount = scorable(allAssessments).length;
  const flaggedTotal = student.sessions
    .flatMap((s) => s.responses)
    .filter((r) => r.assessment?.safetyFlagged).length;

  // Vaqt bo'yicha qator: ertaklar eski→yangi tartibida
  const chronological = [...byStory.values()].sort(
    (a, b) => a.firstAt.getTime() - b.firstAt.getTime(),
  );
  const seriesFor = (criterion: (typeof CRITERIA)[number]) =>
    chronological.map((g) => g.levels?.[criterion] ?? 0).filter((v) => v > 0);

  const best = student.sessions
    .flatMap((s) =>
      s.responses.map((r) => ({ response: r, storyTitle: s.story.title, storyId: s.storyId })),
    )
    .filter((x) => x.response.assessment && !x.response.assessment.safetyFlagged)
    .sort((a, b) => totalLevel(b.response.assessment!) - totalLevel(a.response.assessment!))
    .slice(0, 3);

  const calibration = CALIBRATION[clampGrade(student.classroom.grade)];

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Breadcrumb
          items={[
            { href: "/oqituvchi", label: "Sinflar" },
            { href: `/oqituvchi/${student.classroomId}`, label: student.classroom.name },
            { label: name },
          ]}
        />

        <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">{name}</h1>
            <p className="mt-1 text-[var(--ink-soft)]">
              {student.classroom.name} · {student.classroom.grade}-sinf normasi:{" "}
              {calibration.fluency.min}–{calibration.fluency.max} g&apos;oya,{" "}
              {calibration.flexibility.min}–{calibration.flexibility.max} toifa,{" "}
              {calibration.elaboration.min}–{calibration.elaboration.max} tafsilot
            </p>
          </div>
          <p className="text-sm text-[var(--ink-soft)]">
            {stories.length} ta ertak · {scoredCount} ta baholangan javob
          </p>
        </header>

        {flaggedTotal > 0 && (
          <p className="mt-5 rounded-xl border border-[var(--warn)] bg-[var(--surface)] px-4 py-3 font-bold text-[var(--warn)]">
            {flaggedTotal} ta javob alohida belgilangan — ular ballanmadi va ko&apos;rib
            chiqishingizni kutmoqda.
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-extrabold">Umumiy manzara</h2>
          <p className="mt-1 text-[var(--ink-soft)]">
            Barcha ertaklar bo&apos;yicha o&apos;rtacha. Ustunchalar — ertakdan ertakka o&apos;zgarish.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {CRITERIA.map((criterion) => (
              <CriterionCard
                key={criterion}
                criterion={criterion}
                level={overallRounded?.[criterion] ?? null}
                average={overall?.[criterion] ?? null}
                trend={trendOf(seriesFor(criterion))}
                series={seriesFor(criterion)}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold">Ertaklar bo&apos;yicha</h2>
          <p className="mt-1 text-[var(--ink-soft)]">
            Har bir ertakni ochib, o&apos;sha darsdagi javoblarni va daraxtni ko&apos;rasiz.
          </p>

          <ul className="mt-4 space-y-3">
            {stories.map((group) => (
              <li key={group.storyId}>
                <Link
                  href={`/oqituvchi/oquvchi/${student.id}/ertak/${group.storyId}`}
                  className="card block p-5 transition hover:-translate-y-0.5 hover:border-[var(--leaf)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0">
                      <p className="text-lg font-extrabold">{group.title}</p>
                      <p className="mt-1 text-sm text-[var(--ink-soft)]">
                        {new Date(group.lastAt).toLocaleDateString("uz-UZ", {
                          day: "numeric",
                          month: "long",
                        })}{" "}
                        · {group.responseCount} javob
                        {group.sessionIds.length > 1 && ` · ${group.sessionIds.length} dars`}
                        {group.editedCount > 0 && " · tahrirlangan"}
                      </p>
                      {group.flaggedCount > 0 && (
                        <p className="mt-1 text-sm font-bold text-[var(--warn)]">
                          {group.flaggedCount} ta belgilangan javob
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {CRITERIA.map((criterion) => (
                          <div key={criterion} className="text-center">
                            <LevelChip level={group.levels?.[criterion] ?? 0} />
                            <p className="mt-1 text-[11px] font-bold text-[var(--ink-soft)]">
                              {CRITERION_SHORT[criterion]}
                            </p>
                          </div>
                        ))}
                      </div>
                      <span aria-hidden="true" className="text-xl text-[var(--ink-soft)]">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}

            {stories.length === 0 && (
              <li className="card p-6 text-[var(--ink-soft)]">
                Bu o&apos;quvchi hali birorta darsni boshlamagan.
              </li>
            )}
          </ul>
        </section>

        {best.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-extrabold">Eng yaxshi javoblari</h2>
            <p className="mt-1 text-[var(--ink-soft)]">Ota-onaga ko&apos;rsatish uchun.</p>
            <ul className="mt-4 space-y-3">
              {best.map(({ response, storyTitle }) => (
                <li key={response.id} className="card p-5">
                  <p className="text-sm font-bold text-[var(--ink-soft)]">
                    {storyTitle} · {response.task.prompt}
                  </p>
                  <p className="story-text mt-2">{response.rawText}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
