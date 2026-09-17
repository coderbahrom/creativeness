import type { Criterion } from "./torrance";

/**
 * O'qituvchi paneli uchun yig'ma hisoblar.
 *
 * Muhim tamoyil: hamma joyda bitta qoida ishlaydi — xavfsizlik belgisi
 * qo'yilgan javob ballanmaydi va o'rtachaga qo'shilmaydi (7.4-bo'lim).
 */

export const CRITERIA = ["fluency", "flexibility", "originality", "elaboration"] as const;

export type Levels = Record<Criterion, number>;

type ScorableAssessment = {
  fluency: number;
  flexibility: number;
  originality: number;
  elaboration: number;
  safetyFlagged: boolean;
};

/** Ballangan (belgilanmagan) baholarni ajratib olish */
export function scorable<T extends ScorableAssessment | null | undefined>(
  items: T[],
): NonNullable<T>[] {
  return items.filter((a): a is NonNullable<T> => Boolean(a) && !a!.safetyFlagged);
}

/** 4 mezon bo'yicha o'rtacha. Baho bo'lmasa — null (nol emas: "yo'q" va "past" farqlanadi) */
export function averageLevels(assessments: ScorableAssessment[]): Levels | null {
  const ok = scorable(assessments);
  if (!ok.length) return null;
  return CRITERIA.reduce((acc, c) => {
    acc[c] = ok.reduce((sum, a) => sum + a[c], 0) / ok.length;
    return acc;
  }, {} as Levels);
}

export function roundLevels(levels: Levels | null): Levels | null {
  if (!levels) return null;
  return CRITERIA.reduce((acc, c) => {
    acc[c] = Math.round(levels[c]);
    return acc;
  }, {} as Levels);
}

/** Umumiy kuch — 4 mezon yig'indisi. "Eng yaxshi javob" tartibi uchun */
export function totalLevel(a: ScorableAssessment): number {
  return CRITERIA.reduce((sum, c) => sum + a[c], 0);
}

export type Trend = "up" | "down" | "flat" | "unknown";

/**
 * O'sish yo'nalishi: ketma-ket darajalarning birinchi yarmi oxirgi yarmi bilan
 * solishtiriladi. Kamida 2 ta nuqta kerak, aks holda "unknown".
 */
export function trendOf(series: number[]): Trend {
  if (series.length < 2) return "unknown";
  const mid = Math.floor(series.length / 2);
  const first = series.slice(0, mid);
  const last = series.slice(series.length - mid);
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const delta = avg(last) - avg(first);
  if (delta >= 0.4) return "up";
  if (delta <= -0.4) return "down";
  return "flat";
}

export const TREND_LABEL: Record<Trend, string> = {
  up: "o'smoqda",
  down: "pasaymoqda",
  flat: "barqaror",
  unknown: "ma'lumot yetarli emas",
};

type FinalCandidate = {
  sessionId: string;
  taskId: string;
  createdAt: Date;
  assessment: {
    safetyFlagged: boolean;
    teacherEdited: boolean;
    editedAt: Date | null;
  } | null;
};

/**
 * Har bir ish (sessiya × topshiriq) uchun bitta yakuniy javob.
 *
 * Baholash birligi — ish, bo'lak javob emas: Ertakchi savoliga javob va qayta
 * urinishlar o'sha ishning davomi. Yakuniy baho ishning hamma yozganlarini
 * o'z ichiga oladi, shuning uchun o'rtachaga FAQAT u kiradi.
 *
 * Tanlov: o'qituvchi ko'rib chiqqan baho ustun; aks holda eng oxirgi
 * belgilanmagan javob. (lib/scoring.ts dagi finalAssessmentId bilan bir xil qoida.)
 */
export function finalPerTask<R extends FinalCandidate>(responses: R[]): R[] {
  const groups = new Map<string, R[]>();
  for (const r of responses) {
    const key = `${r.sessionId}:${r.taskId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const finals: R[] = [];
  for (const group of groups.values()) {
    const assessed = group
      .filter((r) => r.assessment)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const pick =
      assessed.find((r) => r.assessment!.teacherEdited || r.assessment!.editedAt) ??
      assessed.find((r) => !r.assessment!.safetyFlagged);
    if (pick) finals.push(pick);
  }
  return finals;
}

/** Ish bo'yicha guruhlash — ko'rsatish uchun (javob, Ertakchi savoli, davomi) */
export function groupByTask<R extends { taskId: string; createdAt: Date }>(
  responses: R[],
): { taskId: string; items: R[] }[] {
  const order: string[] = [];
  const map = new Map<string, R[]>();
  for (const r of [...responses].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    if (!map.has(r.taskId)) {
      map.set(r.taskId, []);
      order.push(r.taskId);
    }
    map.get(r.taskId)!.push(r);
  }
  return order.map((taskId) => ({ taskId, items: map.get(taskId)! }));
}
