import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LevelChip } from "@/components/LevelChip";
import { prisma } from "@/lib/db";
import { CALIBRATION, CRITERION_HINTS, CRITERION_LABELS, clampGrade } from "@/lib/torrance";

export const dynamic = "force-dynamic";

const CRITERIA = ["fluency", "flexibility", "originality", "elaboration"] as const;

export default async function ClassroomMap({
  params,
}: {
  params: Promise<{ classroomId: string }>;
}) {
  const { classroomId } = await params;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      students: {
        orderBy: { firstName: "asc" },
        include: {
          responses: {
            include: { assessment: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });
  if (!classroom) notFound();

  const rows = classroom.students.map((student) => {
    const assessments = student.responses
      .map((response) => response.assessment)
      .filter((a): a is NonNullable<typeof a> => Boolean(a) && !a!.safetyFlagged);

    const average = (key: (typeof CRITERIA)[number]) =>
      assessments.length
        ? assessments.reduce((sum, a) => sum + a[key], 0) / assessments.length
        : 0;

    return {
      id: student.id,
      name: `${student.firstName} ${student.lastInitial}.`,
      responseCount: student.responses.length,
      flagged: student.responses.some((r) => r.assessment?.safetyFlagged),
      edited: assessments.some((a) => a.teacherEdited),
      levels: Object.fromEntries(CRITERIA.map((c) => [c, Math.round(average(c))])) as Record<
        (typeof CRITERIA)[number],
        number
      >,
    };
  });

  const classAverage = (key: (typeof CRITERIA)[number]) => {
    const active = rows.filter((row) => row.responseCount > 0);
    if (!active.length) return 0;
    return active.reduce((sum, row) => sum + row.levels[key], 0) / active.length;
  };

  const weakest = [...CRITERIA].sort((a, b) => classAverage(a) - classAverage(b))[0];
  const calibration = CALIBRATION[clampGrade(classroom.grade)];
  const silent = rows.filter((row) => row.responseCount === 0);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/oqituvchi" className="text-sm text-[var(--ink-soft)] hover:underline">
        ← Sinflar
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">{classroom.name} — sinf xaritasi</h1>
      <p className="mt-1 text-[var(--ink-soft)]">
        {classroom.grade}-sinf normasi: {calibration.fluency.min}–{calibration.fluency.max} g&apos;oya,{" "}
        {calibration.flexibility.min}–{calibration.flexibility.max} toifa,{" "}
        {calibration.elaboration.min}–{calibration.elaboration.max} tafsilot.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--line)] text-sm text-[var(--ink-soft)]">
              <th className="py-3 pr-4 font-bold">O&apos;quvchi</th>
              {CRITERIA.map((criterion) => (
                <th key={criterion} className="px-3 py-3 font-bold" title={CRITERION_HINTS[criterion]}>
                  {CRITERION_LABELS[criterion]}
                </th>
              ))}
              <th className="px-3 py-3 font-bold">Javoblar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--line)]">
                <td className="py-2 pr-4">
                  <Link
                    href={`/oqituvchi/oquvchi/${row.id}`}
                    className="font-medium hover:underline"
                  >
                    {row.name}
                  </Link>
                  {row.flagged && (
                    <span className="ml-2 text-xs font-bold text-[var(--warn)]">● ko&apos;rib chiqing</span>
                  )}
                  {row.edited && (
                    <span className="ml-2 text-xs text-[var(--ink-soft)]">tahrirlangan</span>
                  )}
                </td>
                {CRITERIA.map((criterion) => (
                  <td key={criterion} className="px-3 py-2">
                    <LevelChip level={row.levels[criterion]} />
                  </td>
                ))}
                <td className="px-3 py-2 text-sm text-[var(--ink-soft)]">{row.responseCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card mt-8 space-y-2 p-5">
        <h2 className="font-bold">Sinf manzarasi</h2>
        <p className="text-[var(--ink-soft)]">
          Eng past ko&apos;rsatkich: <strong className="text-[var(--ink)]">{CRITERION_LABELS[weakest]}</strong>{" "}
          (o&apos;rtacha {classAverage(weakest).toFixed(1)}). Keyingi darsda shu mezonni
          faollashtiradigan topshiriq tanlang.
        </p>
        {silent.length > 0 && (
          <p className="text-[var(--ink-soft)]">
            Hali javob bermaganlar: {silent.map((row) => row.name).join(", ")}.
          </p>
        )}
        <p className="text-sm text-[var(--ink-soft)]">
          Darajalar: 4 — yosh normasidan yuqori, 3 — normaga mos, 2 — biroz past, 1 —
          qo&apos;llab-quvvatlash kerak. Aniq raqam emas, daraja beriladi: AI o&apos;zbekcha
          bolalar nutqini 100% aniq tahlil qila olmaydi.
        </p>
      </section>
      </main>
    </>
  );
}
