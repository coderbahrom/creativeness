import Link from "next/link";
import { notFound } from "next/navigation";
import { LevelChip } from "@/components/LevelChip";
import {
  CRITERIA,
  averageLevels,
  finalPerTask,
  groupByTask,
  roundLevels,
  scorable,
  totalLevel,
  trendOf,
  TREND_LABEL,
} from "@/lib/analytics";
import { prisma } from "@/lib/db";
import {
  CALIBRATION,
  CRITERION_HINTS,
  CRITERION_LABELS,
  LEVEL_LABELS,
  clampGrade,
} from "@/lib/torrance";

export const dynamic = "force-dynamic";

/**
 * Chorak hisoboti (9.4-bo'lim) — ota-onaga beriladigan varaq.
 * Brauzerning "Chop etish → PDF" i orqali saqlanadi, alohida kutubxona kerak emas.
 *
 * Etika: bu yerda taqqoslash yo'q, reyting yo'q, "past" degan xulosa yo'q.
 * Faqat bolaning o'z o'sishi va o'z ishlari (12-bo'lim).
 */
export default async function ReportPage({
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
  const assessments = finalPerTask(student.sessions.flatMap((s) => s.responses))
    .map((r) => r.assessment)
    .filter(Boolean) as never[];
  const overall = averageLevels(assessments);
  const rounded = roundLevels(overall);
  const scoredCount = scorable(assessments).length;

  // Ertak bo'yicha daraja — o'sishni ko'rsatish uchun
  const perStory = [...new Map(student.sessions.map((s) => [s.storyId, s])).keys()].map(
    (storyId) => {
      const sessions = student.sessions.filter((s) => s.storyId === storyId);
      const a = finalPerTask(sessions.flatMap((s) => s.responses))
        .map((r) => r.assessment)
        .filter(Boolean);
      return {
        title: sessions[0].story.title,
        at: sessions[0].startedAt,
        levels: roundLevels(averageLevels(a as never[])),
      };
    },
  );

  const seriesFor = (criterion: (typeof CRITERIA)[number]) =>
    perStory.map((s) => s.levels?.[criterion] ?? 0).filter((v) => v > 0);

  const best = student.sessions
    .flatMap((s) =>
      groupByTask(s.responses).map(({ items }) => ({
        id: `${s.id}:${items[0].taskId}`,
        storyTitle: s.story.title,
        prompt: items[0].task.prompt,
        parts: items.filter((r) => !r.assessment?.safetyFlagged).map((r) => r.rawText),
        assessment: finalPerTask(items)[0]?.assessment ?? null,
      })),
    )
    .filter((x) => x.assessment && !x.assessment.safetyFlagged)
    .sort((a, b) => totalLevel(b.assessment!) - totalLevel(a.assessment!))
    .slice(0, 3);

  const notes = student.sessions
    .flatMap((s) => s.responses.map((r) => r.assessment?.teacherNote))
    .filter((n): n is string => Boolean(n && n.trim()));

  const calibration = CALIBRATION[clampGrade(student.classroom.grade)];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <Link
          href={`/oqituvchi/oquvchi/${student.id}`}
          className="text-sm text-[var(--ink-soft)] hover:underline"
        >
          ← Profilga qaytish
        </Link>
        <p className="ml-auto text-sm text-[var(--ink-soft)]">
          Chop etish uchun: Ctrl/Cmd + P → &quot;PDF sifatida saqlash&quot;
        </p>
      </div>

      <header className="border-b-2 border-[var(--line-strong)] pb-5">
        <p className="text-sm font-bold text-[var(--ink-soft)]">
          Ertak Bog&apos;i · kreativ o&apos;qish bo&apos;yicha hisobot
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">{name}</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          {student.classroom.name} ·{" "}
          {new Date().toLocaleDateString("uz-UZ", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      <section className="mt-7">
        <h2 className="text-lg font-extrabold">Bola nima qildi</h2>
        <p className="mt-2 text-[var(--ink-soft)]">
          {perStory.length} ta ertakni o&apos;qib, ularni o&apos;zicha davom ettirdi.{" "}
          {scoredCount} ta kreativ topshiriqni bajardi. Har bir javob to&apos;rt mezon bo&apos;yicha
          baholandi: qancha g&apos;oya topgani, g&apos;oyalari qanchalik xilma-xil ekani,
          qanchalik o&apos;ziga xos ekani va qanchalik batafsil o&apos;ylaganligi.
        </p>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-extrabold">Natijalar</h2>
        <table className="mt-3 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--line)] text-sm text-[var(--ink-soft)]">
              <th className="py-2 pr-4 font-bold">Mezon</th>
              <th className="px-3 py-2 font-bold">Daraja</th>
              <th className="px-3 py-2 font-bold">Ma&apos;nosi</th>
              <th className="px-3 py-2 font-bold">O&apos;zgarish</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((criterion) => {
              const level = rounded?.[criterion] ?? 0;
              const trend = trendOf(seriesFor(criterion));
              return (
                <tr key={criterion} className="border-b border-[var(--line)]">
                  <td className="py-3 pr-4">
                    <p className="font-bold">{CRITERION_LABELS[criterion]}</p>
                    <p className="text-sm text-[var(--ink-soft)]">{CRITERION_HINTS[criterion]}</p>
                  </td>
                  <td className="px-3 py-3">
                    <LevelChip level={level} />
                  </td>
                  <td className="px-3 py-3 text-sm">
                    {level ? LEVEL_LABELS[level] : "Baholanmagan"}
                  </td>
                  <td className="px-3 py-3 text-sm text-[var(--ink-soft)]">
                    {trend === "unknown" ? "—" : TREND_LABEL[trend]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">
          Darajalar {student.classroom.grade}-sinf normasiga nisbatan:{" "}
          {calibration.fluency.min}–{calibration.fluency.max} g&apos;oya,{" "}
          {calibration.flexibility.min}–{calibration.flexibility.max} toifa,{" "}
          {calibration.elaboration.min}–{calibration.elaboration.max} tafsilot kutiladi.
          4 — normadan yuqori, 3 — normaga mos, 2 — rivojlanmoqda, 1 —
          qo&apos;llab-quvvatlash foydali.
        </p>
      </section>

      {perStory.length > 1 && (
        <section className="mt-7 break-inside-avoid">
          <h2 className="text-lg font-extrabold">Ertakdan ertakka</h2>
          <table className="mt-3 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-soft)]">
                <th className="py-2 pr-4 font-bold">Ertak</th>
                {CRITERIA.map((c) => (
                  <th key={c} className="px-2 py-2 text-center font-bold">
                    {CRITERION_LABELS[c].slice(0, 3)}.
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perStory.map((s, i) => (
                <tr key={i} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-4">
                    <span className="font-bold">{s.title}</span>{" "}
                    <span className="text-[var(--ink-soft)]">
                      {new Date(s.at).toLocaleDateString("uz-UZ", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </td>
                  {CRITERIA.map((c) => (
                    <td key={c} className="px-2 py-2 text-center">
                      <LevelChip level={s.levels?.[c] ?? 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {best.length > 0 && (
        <section className="mt-7">
          <h2 className="text-lg font-extrabold">Eng yaxshi javoblari</h2>
          <ul className="mt-3 space-y-4">
            {best.map((item) => (
              <li key={item.id} className="break-inside-avoid">
                <p className="text-sm font-bold text-[var(--ink-soft)]">
                  {item.storyTitle} · {item.prompt}
                </p>
                <div className="story-text mt-1 space-y-1">
                  {item.parts.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {notes.length > 0 && (
        <section className="mt-7 break-inside-avoid">
          <h2 className="text-lg font-extrabold">O&apos;qituvchi izohi</h2>
          <ul className="mt-2 space-y-2">
            {notes.map((note, i) => (
              <li key={i} className="text-[var(--ink)]">
                {note}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-9 border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-soft)]">
        <p>
          Bu hisobotda bolalar bir-biri bilan taqqoslanmaydi va reyting tuzilmaydi — faqat
          bolaning o&apos;z ishi va o&apos;z o&apos;sishi ko&apos;rsatiladi. Baholar
          o&apos;qituvchi tomonidan tekshirilgan.
        </p>
        <p className="mt-2">
          <strong className="text-[var(--ink)]">Naima.CreativRead</strong> metodikasi ·
          Torrance kreativlik mezonlari
        </p>
      </footer>
    </main>
  );
}
