import Link from "next/link";
import { notFound } from "next/navigation";
import { AssessmentEditor } from "@/components/AssessmentEditor";
import { LevelChip } from "@/components/LevelChip";
import { prisma } from "@/lib/db";
import {
  CATEGORY_LABELS,
  CRITERION_LABELS,
  TASK_TYPES,
  type IdeaCategory,
  type TaskType,
} from "@/lib/torrance";

export const dynamic = "force-dynamic";

const CRITERIA = ["fluency", "flexibility", "originality", "elaboration"] as const;

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
      responses: {
        orderBy: { createdAt: "desc" },
        include: { assessment: true, ideas: { orderBy: { order: "asc" } }, task: true },
      },
    },
  });
  if (!student) notFound();

  const scored = student.responses.filter((r) => r.assessment && !r.assessment.safetyFlagged);
  const average = (key: (typeof CRITERIA)[number]) =>
    scored.length ? scored.reduce((sum, r) => sum + r.assessment![key], 0) / scored.length : 0;

  const best = [...scored]
    .sort(
      (a, b) =>
        CRITERIA.reduce((sum, c) => sum + b.assessment![c], 0) -
        CRITERIA.reduce((sum, c) => sum + a.assessment![c], 0),
    )
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link
        href={`/oqituvchi/${student.classroomId}`}
        className="text-sm text-[var(--ink-soft)] hover:underline"
      >
        ← {student.classroom.name}
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">
        {student.firstName} {student.lastInitial}.
      </h1>

      <section className="card mt-6 p-5">
        <h2 className="font-bold">4 mezon bo&apos;yicha o&apos;rtacha</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CRITERIA.map((criterion) => (
            <div key={criterion}>
              <p className="text-sm text-[var(--ink-soft)]">{CRITERION_LABELS[criterion]}</p>
              <p className="mt-1 flex items-center gap-2">
                <LevelChip level={Math.round(average(criterion))} />
                <span className="text-sm text-[var(--ink-soft)]">
                  {average(criterion).toFixed(1)}
                </span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          {scored.length} ta baholangan javob asosida.
        </p>
      </section>

      {best.length > 0 && (
        <section className="card mt-6 p-5">
          <h2 className="font-bold">Eng yaxshi javoblari</h2>
          <ul className="mt-3 space-y-3">
            {best.map((response) => (
              <li key={response.id} className="border-l-2 border-[var(--leaf)] pl-3">
                <p className="text-sm text-[var(--ink-soft)]">{response.task.prompt}</p>
                <p className="mt-1">{response.rawText}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mt-10 mb-4 text-lg font-bold">Barcha javoblar</h2>
      <div className="space-y-5">
        {student.responses.map((response) => {
          const assessment = response.assessment;
          return (
            <article key={response.id} className="card space-y-4 p-5">
              <header>
                <p className="text-xs font-bold tracking-wide text-[var(--ink-soft)] uppercase">
                  {TASK_TYPES[response.task.type as TaskType]?.label ?? response.task.type} ·{" "}
                  {new Date(response.createdAt).toLocaleDateString("uz-UZ")} ·{" "}
                  {response.inputMethod}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">{response.task.prompt}</p>
              </header>

              <p className="whitespace-pre-line">{response.rawText}</p>

              {assessment?.safetyFlagged ? (
                <div className="rounded-lg border border-[var(--warn)] p-3">
                  <p className="font-bold text-[var(--warn)]">Alohida belgilangan javob</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Bu javob ballanmadi va AI savol bermadi. Tizim hech qanday xulosa chiqarmaydi —
                    qaror sizda.
                  </p>
                  {assessment.safetyNote && (
                    <p className="mt-2 text-sm">{assessment.safetyNote}</p>
                  )}
                </div>
              ) : (
                response.ideas.length > 0 && (
                  <ul className="flex flex-wrap gap-2 text-sm">
                    {response.ideas.map((idea) => (
                      <li
                        key={idea.id}
                        className="rounded-full border border-[var(--line)] px-3 py-1"
                        title={`Kalit: ${idea.canonicalKey}`}
                      >
                        {CATEGORY_LABELS[idea.category as IdeaCategory] ?? idea.category}
                        {idea.elaborationCount > 0 && ` · +${idea.elaborationCount} tafsilot`}
                      </li>
                    ))}
                  </ul>
                )
              )}

              {assessment && (
                <>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {assessment.ideaCount} g&apos;oya · {assessment.categoryCount} toifa ·{" "}
                    {assessment.detailCount} tafsilot · kamyoblik{" "}
                    {(assessment.rarityScore * 100).toFixed(0)}% ({assessment.originalityBase}{" "}
                    bazasi)
                    {assessment.model === "heuristic" && " · AI tahlilisiz"}
                  </p>

                  {assessment.aiRationale && (
                    <p className="text-sm text-[var(--ink-soft)]">{assessment.aiRationale}</p>
                  )}
                  {assessment.aiQuestion && (
                    <p className="text-sm">
                      <span className="font-bold text-[var(--leaf-deep)]">Ertakchi savoli:</span>{" "}
                      {assessment.aiQuestion}
                    </p>
                  )}

                  <AssessmentEditor
                    assessmentId={assessment.id}
                    initial={{
                      fluency: assessment.fluency,
                      flexibility: assessment.flexibility,
                      originality: assessment.originality,
                      elaboration: assessment.elaboration,
                    }}
                    initialNote={assessment.teacherNote}
                    edited={assessment.teacherEdited}
                    flagged={assessment.safetyFlagged}
                  />
                </>
              )}
            </article>
          );
        })}
        {student.responses.length === 0 && (
          <p className="text-[var(--ink-soft)]">Hali javob yo&apos;q.</p>
        )}
      </div>
    </main>
  );
}
