import { AppHeader } from "@/components/AppHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CRITERIA } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { CRITERION_LABELS } from "@/lib/torrance";

export const dynamic = "force-dynamic";

/**
 * AI bahosi va o'qituvchi bahosining mos kelishi (15-bo'lim, maqsad 80%+).
 *
 * Faqat O'QITUVCHI KO'RIB CHIQQAN javoblar hisobga olinadi: ko'rilmagan baho
 * "rozilik" emas. Shuning uchun sahifa ko'rib chiqilganlar ulushini ham
 * ko'rsatadi — baza kichik bo'lsa, foiz ishonchsiz.
 */
export default async function AgreementPage() {
  const assessments = await prisma.assessment.findMany({
    where: { safetyFlagged: false, aiFluency: { not: null } },
    select: {
      fluency: true,
      flexibility: true,
      originality: true,
      elaboration: true,
      aiFluency: true,
      aiFlexibility: true,
      aiOriginality: true,
      aiElaboration: true,
      editedAt: true,
      model: true,
    },
  });

  const reviewed = assessments.filter((a) => a.editedAt !== null);

  const aiOf = {
    fluency: (a: (typeof assessments)[number]) => a.aiFluency,
    flexibility: (a: (typeof assessments)[number]) => a.aiFlexibility,
    originality: (a: (typeof assessments)[number]) => a.aiOriginality,
    elaboration: (a: (typeof assessments)[number]) => a.aiElaboration,
  } as const;

  const stats = CRITERIA.map((criterion) => {
    const pairs = reviewed
      .map((a) => ({ ai: aiOf[criterion](a), teacher: a[criterion] }))
      .filter((p): p is { ai: number; teacher: number } => p.ai !== null);

    const exact = pairs.filter((p) => p.ai === p.teacher).length;
    const within1 = pairs.filter((p) => Math.abs(p.ai - p.teacher) <= 1).length;
    const bias = pairs.length
      ? pairs.reduce((sum, p) => sum + (p.teacher - p.ai), 0) / pairs.length
      : 0;

    return {
      criterion,
      count: pairs.length,
      exactPct: pairs.length ? (exact / pairs.length) * 100 : null,
      within1Pct: pairs.length ? (within1 / pairs.length) * 100 : null,
      bias,
    };
  });

  const totalPairs = stats.reduce((sum, s) => sum + s.count, 0);
  const overallExact = totalPairs
    ? (stats.reduce((sum, s) => sum + ((s.exactPct ?? 0) / 100) * s.count, 0) / totalPairs) * 100
    : null;

  const heuristicShare = assessments.length
    ? (assessments.filter((a) => a.model === "heuristic").length / assessments.length) * 100
    : 0;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Breadcrumb
          items={[{ href: "/oqituvchi", label: "Sinflar" }, { label: "AI va pedagog mosligi" }]}
        />

        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">AI va pedagog mosligi</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          AI qo&apos;ygan baho o&apos;qituvchi bahosiga qanchalik mos kelyapti. Hujjatdagi
          maqsad — <strong className="text-[var(--ink)]">80% dan yuqori</strong>. Faqat siz
          ko&apos;rib chiqqan (tasdiqlagan yoki o&apos;zgartirgan) javoblar hisobga olinadi.
        </p>

        <section className="card mt-6 p-5">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-sm font-bold text-[var(--ink-soft)]">Umumiy moslik</p>
              <p className="text-4xl font-extrabold">
                {overallExact === null ? "—" : `${overallExact.toFixed(0)}%`}
              </p>
            </div>
            <p className="text-[var(--ink-soft)]">
              {reviewed.length} ta ko&apos;rib chiqilgan javob ({assessments.length} tadan)
            </p>
          </div>

          {reviewed.length < 20 && (
            <p className="mt-3 text-sm text-[var(--warn)]">
              Baza kichik: ishonchli xulosa uchun kamida 20–30 ta ko&apos;rib chiqilgan javob
              kerak. O&apos;quvchi sahifalarida baholarni tasdiqlab boring.
            </p>
          )}
        </section>

        <section className="mt-6 overflow-x-auto rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-sm text-[var(--ink-soft)]">
                <th className="px-5 py-3 font-bold">Mezon</th>
                <th className="px-3 py-3 text-center font-bold">Aynan mos</th>
                <th className="px-3 py-3 text-center font-bold">±1 daraja</th>
                <th className="px-3 py-3 text-center font-bold">Og&apos;ish</th>
                <th className="px-5 py-3 text-right font-bold">Javoblar</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr key={row.criterion} className="border-b border-[var(--line)] last:border-0">
                  <td className="px-5 py-3 font-bold">{CRITERION_LABELS[row.criterion]}</td>
                  <td className="px-3 py-3 text-center">
                    {row.exactPct === null ? (
                      <span className="text-[var(--ink-soft)]">—</span>
                    ) : (
                      <span
                        className="font-extrabold"
                        style={{
                          color:
                            row.exactPct >= 80
                              ? "var(--level-4-strong)"
                              : row.exactPct >= 60
                                ? "var(--level-2-strong)"
                                : "var(--level-1-strong)",
                        }}
                      >
                        {row.exactPct.toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-[var(--ink-soft)]">
                    {row.within1Pct === null ? "—" : `${row.within1Pct.toFixed(0)}%`}
                  </td>
                  <td className="px-3 py-3 text-center text-[var(--ink-soft)]">
                    {row.count === 0
                      ? "—"
                      : row.bias > 0.1
                        ? `AI past baholaydi (+${row.bias.toFixed(1)})`
                        : row.bias < -0.1
                          ? `AI yuqori baholaydi (${row.bias.toFixed(1)})`
                          : "farq yo'q"}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-[var(--ink-soft)]">
                    {row.count || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card mt-6 space-y-2 p-5 text-sm text-[var(--ink-soft)]">
          <p>
            <strong className="text-[var(--ink)]">Og&apos;ish</strong> — o&apos;qituvchi bahosi
            bilan AI bahosi orasidagi o&apos;rtacha farq. Musbat bo&apos;lsa, AI bolani
            o&apos;qituvchiga qaraganda pastroq baholayapti.
          </p>
          {heuristicShare > 0 && (
            <p>
              Baholarning {heuristicShare.toFixed(0)}% i{" "}
              <strong className="text-[var(--ink)]">AI tahlilisiz</strong> (zaxira rejim)
              qo&apos;yilgan — bu foizni pasaytiradi.
            </p>
          )}
          <p>
            Bu jadval dissertatsiya uchun asosiy o&apos;lchov: AI bahosining asl nusxasi
            o&apos;zgarmas saqlanadi, sizning tahriringiz unga tegmaydi.
          </p>
        </section>
      </main>
    </>
  );
}
