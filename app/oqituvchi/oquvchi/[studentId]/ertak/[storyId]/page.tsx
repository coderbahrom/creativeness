import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Ertakchi } from "@/components/Ertakchi";
import { LevelChip } from "@/components/LevelChip";
import { ResolveFlag } from "@/components/ResolveFlag";
import { Tree, TreeLegend } from "@/components/Tree";
import {
  CRITERIA,
  averageLevels,
  finalPerTask,
  groupByTask,
  roundLevels,
} from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { mergeIdeas } from "@/lib/scoring";
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
  const allResponses = sessions.flatMap((s) => s.responses);
  const finals = finalPerTask(allResponses);
  const finalAssessments = finals.map((r) => r.assessment).filter(Boolean) as never[];
  const levels = roundLevels(averageLevels(finalAssessments));
  const average = averageLevels(finalAssessments);
  const workCount = new Set(allResponses.map((r) => `${r.sessionId}:${r.taskId}`)).size;

  // Daraxtlar sessiya bo'yicha — bolaning o'sha darsda ko'rgan manzarasi
  const trees = await Promise.all(sessions.map((s) => buildTree(s.id)));

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
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
            {name} · {sessions.length} ta dars · {workCount} ta topshiriq
          </p>
        </header>

        <section className="card mt-6 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-extrabold">Shu ertak bo&apos;yicha baho</h2>
            <p className="text-sm text-[var(--ink-soft)]">
              Har bir topshiriq bir marta hisoblanadi — Ertakchiga javoblar o&apos;sha ishning ichida
            </p>
          </div>
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
          const works = groupByTask(session.responses);
          return (
            <section key={session.id} className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-extrabold">
                  {sessions.length > 1 ? `${sessions.length - si}-dars` : "Dars"}
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

              <div className="mt-4 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="lg:sticky lg:top-24 lg:self-start">
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

                <div className="space-y-5">
                  {works.map(({ taskId, items }) => {
                    const task = items[0].task;
                    const final = finalPerTask(items)[0] ?? null;
                    const assessment = final?.assessment ?? null;
                    const ideas = mergeIdeas(items);
                    const flaggedParts = items.filter((r) => r.assessment?.safetyFlagged);

                    return (
                      <article key={taskId} className="card space-y-5 p-5">
                        <header className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--ink-soft)]">
                              {TASK_TYPES[task.type as TaskType]?.label ?? task.type}
                            </p>
                            <p className="mt-1 font-bold">{task.prompt}</p>
                          </div>
                          {items.length > 1 && (
                            <span className="shrink-0 rounded-full bg-[var(--surface-sunk)] px-3 py-1 text-xs font-bold text-[var(--ink-soft)]">
                              {items.length} bo&apos;lak — bitta ish
                            </span>
                          )}
                        </header>

                        {/* Suhbat: bola → Ertakchi → bola davomi */}
                        <ol className="space-y-3">
                          {items.map((response, i) => (
                            <li key={response.id} className="space-y-3">
                              <div
                                className={`rounded-2xl p-4 ${
                                  response.assessment?.safetyFlagged
                                    ? "border border-[var(--warn)]"
                                    : "bg-[var(--surface-sunk)]"
                                }`}
                              >
                                <p className="mb-1 text-xs font-bold text-[var(--ink-soft)]">
                                  {i === 0 ? "Bola" : "Bola — davomi"} · {response.inputMethod}
                                </p>
                                <p className="story-text whitespace-pre-line">
                                  {response.rawText}
                                </p>
                                {response.assessment?.safetyFlagged && (
                                  <p className="mt-2 text-sm font-bold text-[var(--warn)]">
                                    Alohida belgilangan — ballanmadi.
                                    {response.assessment.safetyNote &&
                                      ` ${response.assessment.safetyNote}`}
                                  </p>
                                )}
                              </div>

                              {response.assessment?.aiQuestion && (
                                <div className="flex items-start gap-3 pl-2">
                                  <Ertakchi className="h-8 w-8 shrink-0" />
                                  <p className="pt-1">
                                    <span className="text-xs font-bold text-[var(--ink-soft)]">
                                      Ertakchi so&apos;radi
                                    </span>
                                    <br />
                                    {response.assessment.aiQuestion}
                                  </p>
                                </div>
                              )}
                            </li>
                          ))}
                        </ol>

                        {ideas.length > 0 && (
                          <div>
                            <p className="mb-2 text-sm font-bold text-[var(--ink-soft)]">
                              Ishdagi g&apos;oyalar
                            </p>
                            <ul className="flex flex-wrap gap-2 text-sm">
                              {ideas.map((idea) => (
                                <li
                                  key={idea.key}
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
                                  {idea.elaboration > 0 && (
                                    <span className="text-[var(--ink-soft)]">
                                      +{idea.elaboration}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {assessment ? (
                          <div className="space-y-4 border-t border-[var(--line)] pt-4">
                            <p className="text-sm text-[var(--ink-soft)]">
                              {assessment.ideaCount} g&apos;oya · {assessment.categoryCount} toifa ·{" "}
                              {assessment.detailCount} tafsilot · kamyoblik{" "}
                              {(assessment.rarityScore * 100).toFixed(0)}% (
                              {assessment.originalityBase} bazasi)
                              {assessment.model === "heuristic" && " · AI tahlilisiz"}
                            </p>

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
                              flagged={false}
                            />
                          </div>
                        ) : (
                          <p className="border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-soft)]">
                            Bu ishda baholanadigan qism yo&apos;q.
                          </p>
                        )}

                        {flaggedParts.map((part) => (
                          <ResolveFlag key={part.id} assessmentId={part.assessment!.id} />
                        ))}
                      </article>
                    );
                  })}

                  {works.length === 0 && (
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
