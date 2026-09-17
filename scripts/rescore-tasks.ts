/**
 * Mavjud baholarni yangi birlikka o'tkazish: har bir ish (sessiya × topshiriq)
 * bitta yig'ma baho oladi. Qayta ishga tushirish xavfsiz (idempotent).
 *
 *   npx tsx scripts/rescore-tasks.ts --dry   # nima o'zgarishini ko'rsatadi, yozmaydi
 *   npx tsx scripts/rescore-tasks.ts         # yozadi
 *
 * O'qituvchi ko'rib chiqqan baholarga TEGILMAYDI.
 * Eski bo'lak baholar tarix sifatida qoladi — o'rtachaga endi kirmaydi.
 */
import { prisma } from "../lib/db";
import { CRITERIA } from "../lib/analytics";
import { finalAssessmentId, loadTaskPool, recomputeTaskScores, scoreTask } from "../lib/scoring";

const dry = process.argv.includes("--dry");

type Levels = Record<(typeof CRITERIA)[number], number>;
const sumOf = (l: Levels) => CRITERIA.reduce((s, c) => s + l[c], 0);
const mean = (xs: Levels[]): Levels | null =>
  xs.length
    ? (Object.fromEntries(
        CRITERIA.map((c) => [c, xs.reduce((s, x) => s + x[c], 0) / xs.length]),
      ) as Levels)
    : null;

async function main() {
  const responses = await prisma.response.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      sessionId: true,
      taskId: true,
      createdAt: true,
      session: { select: { studentId: true, storyId: true } },
      assessment: {
        select: {
          id: true,
          fluency: true,
          flexibility: true,
          originality: true,
          elaboration: true,
          safetyFlagged: true,
          teacherEdited: true,
          editedAt: true,
        },
      },
    },
  });

  // ESKI ko'rinish: har bir bo'lak javob alohida o'rtachaga kirgan
  const oldByPair = new Map<string, Levels[]>();
  for (const r of responses) {
    if (!r.assessment || r.assessment.safetyFlagged) continue;
    const key = `${r.session.studentId}:${r.session.storyId}`;
    if (!oldByPair.has(key)) oldByPair.set(key, []);
    oldByPair.get(key)!.push(r.assessment);
  }

  // YANGI: har bir ishga bitta yig'ma baho
  const groups = new Map<string, typeof responses>();
  for (const r of responses) {
    const key = `${r.sessionId}:${r.taskId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const pools = new Map<string, Awaited<ReturnType<typeof loadTaskPool>>>();
  const newByPair = new Map<string, Levels[]>();
  let skippedReviewed = 0;

  for (const group of groups.values()) {
    const { sessionId, taskId, session } = group[0];
    const final = finalAssessmentId(group);
    if (!final) continue;

    let levels: Levels;
    if (final.reviewed) {
      skippedReviewed++;
      levels = group.find((r) => r.assessment?.id === final.id)!.assessment!;
    } else {
      if (!pools.has(taskId)) pools.set(taskId, await loadTaskPool(taskId));
      const scores = await scoreTask(sessionId, taskId, pools.get(taskId));
      if (!scores) continue;
      levels = scores;
    }
    const key = `${session.studentId}:${session.storyId}`;
    if (!newByPair.has(key)) newByPair.set(key, []);
    newByPair.get(key)!.push(levels);
  }

  let up = 0,
    down = 0,
    same = 0;
  const changes: { delta: number; before: number; after: number }[] = [];
  for (const [key, olds] of oldByPair) {
    const before = mean(olds);
    const after = mean(newByPair.get(key) ?? []);
    if (!before || !after) continue;
    const delta = sumOf(after) - sumOf(before);
    if (delta > 0.25) up++;
    else if (delta < -0.25) down++;
    else same++;
    changes.push({ delta, before: sumOf(before), after: sumOf(after) });
  }
  changes.sort((a, b) => b.delta - a.delta);

  console.log(
    JSON.stringify(
      {
        rejim: dry ? "quruq (hech narsa yozilmadi)" : "yozildi",
        ishlar: groups.size,
        bolakJavoblar: responses.length,
        koribChiqilganIshTegilmadi: skippedReviewed,
        oquvchiErtakJuftlari: changes.length,
        bahosiOsdi: up,
        bahosiPasaydi: down,
        deyarliOzgarmadi: same,
        engKattaOsish: changes.slice(0, 3).map((c) => `${c.before.toFixed(1)} → ${c.after.toFixed(1)} (4 mezon yig'indisi, max 16)`),
        engKattaPasayish: changes.slice(-2).filter((c) => c.delta < 0).map((c) => `${c.before.toFixed(1)} → ${c.after.toFixed(1)}`),
      },
      null,
      1,
    ),
  );

  if (!dry) {
    let updated = 0;
    const taskIds = [...new Set(responses.map((r) => r.taskId))];
    for (const taskId of taskIds) updated += await recomputeTaskScores(taskId);
    console.log(`Yangilangan yakuniy baholar: ${updated}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
