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
 * BAHOLASH BIRLIGI — bitta darsdagi bitta topshiriq, alohida javob EMAS.
 * Konsepsiyaning asosiy sikli: bolaning javobi → Ertakchi savoli → kengaytirilgan
 * javob. Ertakchiga berilgan javob — o'sha ishning davomi. Uni alohida baholab
 * o'rtachaga qo'shsak, qisqa "chunki u xafa edi" yaxshi javobni pastga tortadi.
 *
 * Shuning uchun bitta (sessiya, topshiriq) ichidagi hamma yozganlar bitta ishga
 * yig'iladi: g'oyalar canonical_key bo'yicha birlashadi, qayta aytilgan g'oya
 * yangi g'oya emas — unga qo'shilgan tafsilot batafsillikni oshiradi.
 *
 * Ravonlik / Moslashuvchanlik / Batafsillik — yig'ilgan ishdan, yosh normasi bilan.
 * Originallik — sinf ichidagi statistik kamyoblikdan (AI hukmidan emas).
 */

export type RarityBase = "sinf" | "platforma";

export type MergedIdea = {
  key: string;
  text: string;
  category: string;
  elaboration: number;
};

export type RarityResult = {
  rarity: number;
  base: RarityBase;
  peerCount: number;
  /** Har bir g'oyaning kamyobligi — o'qituvchiga tushuntirish uchun */
  perIdea: { key: string; text: string; rarity: number; sharedWith: number }[];
};

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

type GroupResponse = {
  id: string;
  createdAt: Date;
  ideas: { canonicalKey: string; text: string; category: string; elaborationCount: number }[];
  assessment: { safetyFlagged: boolean } | null;
};

/**
 * Bitta ish ichidagi g'oyalarni birlashtirish.
 * Belgilangan (xavfsizlik) javob ideyalari hisobga olinmaydi.
 */
export function mergeIdeas(responses: GroupResponse[]): MergedIdea[] {
  const byKey = new Map<string, MergedIdea>();
  const ordered = [...responses].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const response of ordered) {
    if (response.assessment?.safetyFlagged) continue;
    for (const idea of response.ideas) {
      const existing = byKey.get(idea.canonicalKey);
      if (existing) {
        existing.elaboration += idea.elaborationCount;
      } else {
        byKey.set(idea.canonicalKey, {
          key: idea.canonicalKey,
          text: idea.text,
          category: idea.category,
          elaboration: idea.elaborationCount,
        });
      }
    }
  }
  return [...byKey.values()];
}

/** Topshiriq bo'yicha kim qaysi g'oyani aytgani — kamyoblik uchun bir marta yuklanadi */
export type TaskPool = {
  classroomOf: Map<string, string>;
  keysByStudent: Map<string, Set<string>>;
};

export async function loadTaskPool(taskId: string): Promise<TaskPool> {
  const responses = await prisma.response.findMany({
    where: { taskId },
    select: {
      studentId: true,
      student: { select: { classroomId: true } },
      assessment: { select: { safetyFlagged: true } },
      ideas: { select: { canonicalKey: true } },
    },
  });

  const classroomOf = new Map<string, string>();
  const keysByStudent = new Map<string, Set<string>>();
  for (const r of responses) {
    classroomOf.set(r.studentId, r.student.classroomId);
    if (!keysByStudent.has(r.studentId)) keysByStudent.set(r.studentId, new Set());
    if (r.assessment?.safetyFlagged) continue;
    for (const idea of r.ideas) keysByStudent.get(r.studentId)!.add(idea.canonicalKey);
  }
  return { classroomOf, keysByStudent };
}

/**
 * Kamyoblik (0..1). Formula: originallik = 1 − (shu g'oyani aytgan bolalar ulushi).
 * Bola bitta ovoz: bir g'oyani ikki marta aytsa ham bir marta sanaladi.
 * Ish darajasida — eng kamyob 2 g'oyaning o'rtachasi.
 */
export function rarityFor(pool: TaskPool, studentId: string, ideas: MergedIdea[]): RarityResult {
  const classroomId = pool.classroomOf.get(studentId);
  const classStudents = [...pool.keysByStudent.keys()].filter(
    (id) => pool.classroomOf.get(id) === classroomId,
  );

  // 13-bo'lim: sinfda 15 tadan kam bola javob bergan bo'lsa — platforma bazasi.
  const useClass = classStudents.length >= MIN_RESPONSES_FOR_CLASS_RARITY;
  const base: RarityBase = useClass ? "sinf" : "platforma";
  const students = useClass ? classStudents : [...pool.keysByStudent.keys()];

  const total = Math.max(1, students.length);
  const sharedCount = (key: string) =>
    Math.max(1, students.filter((id) => pool.keysByStudent.get(id)?.has(key)).length);

  const perIdea = ideas.map((idea) => {
    const sharedWith = sharedCount(idea.key);
    return { key: idea.key, text: idea.text, rarity: 1 - sharedWith / total, sharedWith };
  });

  const top = [...perIdea].sort((a, b) => b.rarity - a.rarity).slice(0, 2);
  const rarity = top.length ? top.reduce((sum, i) => sum + i.rarity, 0) / top.length : 0;
  return { rarity, base, peerCount: total, perIdea };
}

async function loadGroup(sessionId: string, taskId: string) {
  return prisma.response.findMany({
    where: { sessionId, taskId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      studentId: true,
      student: { select: { classroom: { select: { grade: true } } } },
      ideas: {
        select: { canonicalKey: true, text: true, category: true, elaborationCount: true },
      },
      assessment: {
        select: { id: true, safetyFlagged: true, teacherEdited: true, editedAt: true },
      },
    },
  });
}

/** Bitta ishni (sessiya × topshiriq) yig'ib baholash */
export async function scoreTask(
  sessionId: string,
  taskId: string,
  pool?: TaskPool,
): Promise<ResponseScores | null> {
  const group = await loadGroup(sessionId, taskId);
  if (!group.length) return null;

  const grade = clampGrade(group[0].student.classroom.grade);
  const calibration = CALIBRATION[grade];
  const ideas = mergeIdeas(group);

  const ideaCount = ideas.length;
  const categoryCount = new Set(ideas.map((i) => i.category)).size;
  const detailCount = ideas.reduce((sum, i) => sum + i.elaboration, 0);
  const { rarity, base, peerCount } = rarityFor(
    pool ?? (await loadTaskPool(taskId)),
    group[0].studentId,
    ideas,
  );

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
 * Ishning YAKUNIY bahosi saqlanadigan yozuv.
 * O'qituvchi ko'rib chiqqan baho bo'lsa — o'sha (uning qarori ustun).
 * Aks holda — eng oxirgi belgilanmagan javobning bahosi (u yig'ilgan ishni o'z ichiga oladi).
 */
export function finalAssessmentId(
  group: {
    createdAt: Date;
    assessment: {
      id: string;
      safetyFlagged: boolean;
      teacherEdited: boolean;
      editedAt: Date | null;
    } | null;
  }[],
): { id: string; reviewed: boolean } | null {
  const assessed = [...group]
    .filter((r) => r.assessment)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const reviewed = assessed.find((r) => r.assessment!.teacherEdited || r.assessment!.editedAt);
  if (reviewed) return { id: reviewed.assessment!.id, reviewed: true };

  const latest = assessed.find((r) => !r.assessment!.safetyFlagged);
  return latest ? { id: latest.assessment!.id, reviewed: false } : null;
}

/**
 * Yangi javob kelganda kamyoblik ulushlari siljiydi — shu topshiriq bo'yicha
 * har bir bolaning yakuniy bahosi qayta hisoblanadi.
 * O'qituvchi ko'rib chiqqan baholarga TEGILMAYDI (9.5-bo'lim).
 */
export async function recomputeTaskScores(taskId: string): Promise<number> {
  const pool = await loadTaskPool(taskId);
  const sessions = await prisma.response.findMany({
    where: { taskId },
    distinct: ["sessionId"],
    select: { sessionId: true },
  });

  let updated = 0;
  for (const { sessionId } of sessions) {
    const group = await loadGroup(sessionId, taskId);
    const final = finalAssessmentId(group);
    if (!final || final.reviewed) continue;

    const scores = await scoreTask(sessionId, taskId, pool);
    if (!scores) continue;

    await prisma.assessment.update({
      where: { id: final.id },
      data: {
        ...scores,
        // Tizim hisobi, o'qituvchi tahriri emas — AI nusxasi ham yangilanadi
        aiFluency: scores.fluency,
        aiFlexibility: scores.flexibility,
        aiOriginality: scores.originality,
        aiElaboration: scores.elaboration,
      },
    });
    updated++;
  }
  return updated;
}
