import { prisma } from "./db";
import {
  CALIBRATION,
  MIN_RESPONSES_FOR_CLASS_RARITY,
  clampGrade,
  levelFromBand,
  levelFromRarity,
} from "./torrance";

/**
 * Baholash: xom o'lchovlar → 4 darajali shkala.
 *
 * Ravonlik / Moslashuvchanlik / Batafsillik — javobning o'zidan, yosh normasi bilan solishtirib.
 * Originallik — sinf ichidagi statistik kamyoblikdan (AI hukmidan emas).
 */

type RarityBase = "sinf" | "platforma";

export type RarityResult = {
  rarity: number;
  base: RarityBase;
  peerCount: number;
  /** Har bir g'oyaning kamyobligi — o'qituvchiga tushuntirish uchun */
  perIdea: { key: string; text: string; rarity: number; sharedWith: number }[];
};

/**
 * Bitta javobning kamyoblik ko'rsatkichi (0..1).
 * Formula: originallik = 1 − (shu g'oyani aytgan bolalar ulushi).
 * Javob darajasida — eng kamyob 2 g'oyaning o'rtachasi.
 */
export async function computeRarity(responseId: string): Promise<RarityResult> {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { ideas: true, student: true },
  });
  if (!response) throw new Error(`Javob topilmadi: ${responseId}`);

  const classmates = await prisma.student.findMany({
    where: { classroomId: response.student.classroomId },
    select: { id: true },
  });
  const classmateIds = new Set(classmates.map((s) => s.id));

  const allForTask = await prisma.response.findMany({
    where: { taskId: response.taskId },
    include: { ideas: { select: { canonicalKey: true } } },
  });

  const classResponses = allForTask.filter((r) => classmateIds.has(r.studentId));
  const classStudentCount = new Set(classResponses.map((r) => r.studentId)).size;

  // 13-bo'lim: sinfda 15 tadan kam javob bo'lsa — platforma bazasiga o'tamiz.
  const useClass = classStudentCount >= MIN_RESPONSES_FOR_CLASS_RARITY;
  const base: RarityBase = useClass ? "sinf" : "platforma";
  const pool = useClass ? classResponses : allForTask;

  const studentsByKey = new Map<string, Set<string>>();
  const allStudents = new Set<string>();
  for (const r of pool) {
    allStudents.add(r.studentId);
    for (const idea of r.ideas) {
      if (!studentsByKey.has(idea.canonicalKey)) studentsByKey.set(idea.canonicalKey, new Set());
      studentsByKey.get(idea.canonicalKey)!.add(r.studentId);
    }
  }

  const total = Math.max(1, allStudents.size);
  const perIdea = response.ideas.map((idea) => {
    const sharedWith = studentsByKey.get(idea.canonicalKey)?.size ?? 1;
    return {
      key: idea.canonicalKey,
      text: idea.text,
      rarity: 1 - sharedWith / total,
      sharedWith,
    };
  });

  const top = [...perIdea].sort((a, b) => b.rarity - a.rarity).slice(0, 2);
  const rarity = top.length ? top.reduce((sum, i) => sum + i.rarity, 0) / top.length : 0;

  return { rarity, base, peerCount: total, perIdea };
}

export type ResponseScores = {
  fluency: number;
  flexibility: number;
  originality: number;
  elaboration: number;
  ideaCount: number;
  categoryCount: number;
  detailCount: number;
  rarityScore: number;
  originalityBase: RarityBase;
};

export async function scoreResponse(responseId: string): Promise<ResponseScores> {
  const response = await prisma.response.findUnique({
    where: { id: responseId },
    include: { ideas: true, student: { include: { classroom: true } } },
  });
  if (!response) throw new Error(`Javob topilmadi: ${responseId}`);

  const grade = clampGrade(response.student.classroom.grade);
  const calibration = CALIBRATION[grade];

  const ideaCount = response.ideas.length;
  const categoryCount = new Set(response.ideas.map((i) => i.category)).size;
  const detailCount = response.ideas.reduce((sum, i) => sum + i.elaborationCount, 0);
  const { rarity, base, peerCount } = await computeRarity(responseId);

  return {
    fluency: levelFromBand(ideaCount, calibration.fluency),
    flexibility: levelFromBand(categoryCount, calibration.flexibility),
    originality: levelFromRarity(rarity, peerCount),
    elaboration: levelFromBand(detailCount, calibration.elaboration),
    ideaCount,
    categoryCount,
    detailCount,
    rarityScore: rarity,
    originalityBase: base,
  };
}

/**
 * Yangi javob kelganda kamyoblik ulushlari siljiydi — shu topshiriq bo'yicha
 * barcha originallik baholari qayta hisoblanadi.
 * O'qituvchi qo'lda o'zgartirgan baholarga TEGILMAYDI (9.5-bo'lim).
 */
export async function recomputeTaskOriginality(taskId: string): Promise<number> {
  const responses = await prisma.response.findMany({
    where: { taskId, assessment: { isNot: null } },
    select: { id: true, assessment: { select: { id: true, teacherEdited: true } } },
  });

  let updated = 0;
  for (const response of responses) {
    if (!response.assessment || response.assessment.teacherEdited) continue;
    const { rarity, base, peerCount } = await computeRarity(response.id);
    await prisma.assessment.update({
      where: { id: response.assessment.id },
      data: {
        rarityScore: rarity,
        originalityBase: base,
        originality: levelFromRarity(rarity, peerCount),
      },
    });
    updated++;
  }
  return updated;
}
