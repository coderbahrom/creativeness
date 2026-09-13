import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LevelChip } from "@/components/LevelChip";
import { Tree, TreeLegend } from "@/components/Tree";
import { CRITERIA, averageLevels, roundLevels } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { buildTree } from "@/lib/tree";
import {
  CATEGORY_LABELS,
  CRITERION_HINTS,
  CRITERION_LABELS,
  TASK_TYPES,
  type IdeaCategory,
  type TaskType,
} from "@/lib/torrance";

export const dynamic = "force-dynamic";

export default async function StudentStoryPage({
  params,
}: {
  params: Promise<{ studentId: string; storyId: string }>;
}) {
  const { studentId, storyId } = await params;

  const [student, story, sessions] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, include: { classroom: true } }),
    prisma.story.findUnique({ where: { id: storyId } }),
    prisma.session.findMany({
      where: { studentId, storyId },
      orderBy: { startedAt: "desc" },
      include: {
        responses: {
          orderBy: { createdAt: "asc" },
          include: { assessment: true, task: true, ideas: { orderBy: { order: "asc" } } },
        },
      },
    }),
  ]);
  if (!student || !story) notFound();

  const name = `${student.firstName} ${student.lastInitial}.`;
  const allAssessments = sessions
    .flatMap((s) => s.responses.map((r) => r.assessment))
    .filter(Boolean) as never[];
  const levels = roundLevels(averageLevels(allAssessments));
  const average = averageLevels(allAssessments);

  // Daraxtlar sessiya bo'yicha — bolaning o'sha darsda ko'rgan manzarasi
  const trees = await Promise.all(sessions.map((s) => buildTree(s.id)));

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <Breadcrumb
          items={[
            { href: "/oqituvchi", label: "Sinflar" },
            { href: `/oqituvchi/${student.classroomId}`, label: student.classroom.name },
            { href: `/oqituvchi/oquvchi/${student.id}`, label: name },
            { label: story.title },
          ]}
        />

        <header className="mt-4">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{story.title}</h1>
          <p className="mt-1 text-[var(--ink-soft)]">
            {name} · {sessions.length} ta dars ·{" "}
            {sessions.reduce((sum, s) => sum + s.responses.length, 0)} javob
          </p>
        </header>

        <section className="mt-6 card p-5">
          <h2 className="font-extrabold">Shu ertak bo&apos;yicha baho</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CRITERIA.map((criterion) => (
              <div key={criterion}>
                <p
                  className="text-sm font-bold text-[var(--ink-soft)]"
                  title={CRITERION_HINTS[criterion]}
                >
                  {CRITERION_LABELS[criterion]}
                </p>
                <p className="mt-1.5 flex items-center gap-2">
                  <LevelChip level={levels?.[criterion] ?? 0} />
                  {average && (
                    <span className="text-sm text-[var(--ink-soft)]">
                      {average[criterion].toFixed(1)}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        {sessions.map((session, si) => {
          const tree = trees[si];
          return (
            <section key={session.id} className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-extrabold">
                  {sessions.length > 1 ? `${si + 1}-dars` : "Dars"}
                </h2>
                <p className="text-sm text-[var(--ink-soft)]">
                  {new Date(session.startedAt).toLocaleString("uz-UZ", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {session.finishedAt ? " · yakunlangan" : " · tugallanmagan"}
                </p>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div>
                  <div
                    data-scene="bog"
                    className="overflow-hidden rounded-[1.5rem] border border-[var(--line)]"
                  >
                    <Tree tree={tree} className="block h-56 w-full" />
                  </div>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">
                    {tree.totalIdeas} shox · {tree.totalLeaves} barg · {tree.totalFlowers} gul —
                    bola shu manzarani ko&apos;rgan.
                  </p>
                  <div className="mt-3">
                    <TreeLegend categories={tree.categories} />
                  </div>
                </div>

                <div className="space-y-4">
                  {session.responses.map((response) => {
                    const assessment = response.assessment;
                    return (
                      <article key={response.id} className="card space-y-4 p-5">
                        <header>
                          <p className="text-sm font-bold text-[var(--ink-soft)]">
                            {TASK_TYPES[response.task.type as TaskType]?.label ??
                              response.task.type}
                            {response.followUpOf && " · Ertakchi savolidan keyin"} ·{" "}
                            {response.inputMethod}
                          </p>
                          <p className="mt-1 font-bold">{response.task.prompt}</p>
                        </header>

                        <p className="story-text whitespace-pre-line">{response.rawText}</p>

                        {assessment?.safetyFlagged ? (
                          <div className="rounded-xl border border-[var(--warn)] p-4">
                            <p className="font-bold text-[var(--warn)]">
                              Alohida belgilangan javob
                            </p>
                            <p className="mt-1 text-sm text-[var(--ink-soft)]">
                              Ballanmadi va AI savol bermadi. Tizim xulosa chiqarmaydi — qaror
                              sizda.
                            </p>
                            {assessment.safetyNote && (
                              <p className="mt-2 text-sm">{assessment.safetyNote}</p>
                            )}
                          </div>
                        ) : (
                          response.ideas.length > 0 && (
                            <div>
                              <p className="mb-2 text-sm font-bold text-[var(--ink-soft)]">
                                Ajratilgan g&apos;oyalar
                              </p>
                              <ul className="flex flex-wrap gap-2 text-sm">
                                {response.ideas.map((idea) => (
                                  <li
                                    key={idea.id}
                                    className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-sunk)] px-3 py-1"
                                    title={idea.text}
                                  >
                                    <span
                                      aria-hidden="true"
                                      className="inline-block h-2.5 w-2.5 rounded-full"
                                      style={{ background: `var(--cat-${idea.category})` }}
                                    />
                                    {CATEGORY_LABELS[idea.category as IdeaCategory] ??
                                      idea.category}
                                    {idea.elaborationCount > 0 && (
                                      <span className="text-[var(--ink-soft)]">
                                        +{idea.elaborationCount}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}

                        {assessment && (
                          <>
                            <p className="text-sm text-[var(--ink-soft)]">
                              {assessment.ideaCount} g&apos;oya · {assessment.categoryCount} toifa ·{" "}
                              {assessment.detailCount} tafsilot · kamyoblik{" "}
                              {(assessment.rarityScore * 100).toFixed(0)}% (
                              {assessment.originalityBase} bazasi)
                              {assessment.model === "heuristic" && " · AI tahlilisiz"}
                            </p>

                            {assessment.aiQuestion && (
                              <p className="text-sm">
                                <span className="font-bold text-[var(--leaf-deep)]">
                                  Ertakchi savoli:
                                </span>{" "}
                                {assessment.aiQuestion}
                              </p>
                            )}

                            <div className="border-t border-[var(--line)] pt-4">
                              <AssessmentEditor
                                assessmentId={assessment.id}
                                initial={{
                                  fluency: assessment.fluency,
                                  flexibility: assessment.flexibility,
                                  originality: assessment.originality,
                                  elaboration: assessment.elaboration,
                                }}
                                ai={
                                  assessment.aiFluency === null
                                    ? null
                                    : {
                                        fluency: assessment.aiFluency,
                                        flexibility: assessment.aiFlexibility ?? undefined,
                                        originality: assessment.aiOriginality ?? undefined,
                                        elaboration: assessment.aiElaboration ?? undefined,
                                      }
                                }
                                initialNote={assessment.teacherNote}
                                edited={
                                  assessment.aiFluency !== null &&
                                  (assessment.aiFluency !== assessment.fluency ||
                                    assessment.aiFlexibility !== assessment.flexibility ||
                                    assessment.aiOriginality !== assessment.originality ||
                                    assessment.aiElaboration !== assessment.elaboration)
                                }
                                reviewed={assessment.editedAt !== null}
                                flagged={assessment.safetyFlagged}
                              />
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}

                  {session.responses.length === 0 && (
                    <p className="card p-5 text-[var(--ink-soft)]">
                      Bu darsda javob qoldirilmagan.
                    </p>
                  )}

                  {session.reflection && (
                    <div className="rounded-xl bg-[var(--surface-sunk)] p-4">
                      <p className="text-sm font-bold text-[var(--ink-soft)]">
                        O&apos;z-o&apos;zini baholash: bugungi eng qiziq g&apos;oyam
                      </p>
                      <p className="mt-1">{session.reflection}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {sessions.length === 0 && (
          <p className="card mt-8 p-6 text-[var(--ink-soft)]">
            Bu o&apos;quvchi bu ertak bo&apos;yicha ishlamagan.
          </p>
        )}
      </main>
    </>
  );
}
