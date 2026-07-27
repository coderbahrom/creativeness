/**
 * Torrance 4 mezoni: o'lchash, kalibrlash va daraja hisoblash.
 *
 * Muhim tamoyillar (hujjatning 4-bo'limi):
 *  - Mezonlar barcha sinflar uchun bir xil, KUTILMA darajasi farq qiladi.
 *  - Bolaga ball ko'rsatilmaydi; o'qituvchiga 4 darajali shkala beriladi.
 *  - Originallik AI hukmi emas, sinf ichidagi statistik kamyoblik.
 */

export type Criterion = "fluency" | "flexibility" | "originality" | "elaboration";

export const CRITERION_LABELS: Record<Criterion, string> = {
  fluency: "Ravonlik",
  flexibility: "Moslashuvchanlik",
  originality: "Originallik",
  elaboration: "Batafsillik",
};

export const CRITERION_HINTS: Record<Criterion, string> = {
  fluency: "Nechta ishlaydigan g'oya ishlab chiqarildi",
  flexibility: "G'oyalar necha xil toifaga tegishli",
  originality: "G'oya sinfda qanchalik kam uchraydi",
  elaboration: "Har bir g'oya qanchalik boyitilgan",
};

export const IDEA_CATEGORIES = [
  "personaj",
  "makon",
  "voqea",
  "his",
  "sabab",
  "oqibat",
  "vaqt",
  "obyekt",
] as const;
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  personaj: "Personaj",
  makon: "Makon",
  voqea: "Voqea",
  his: "His-tuyg'u",
  sabab: "Sabab",
  oqibat: "Oqibat",
  vaqt: "Vaqt",
  obyekt: "Ob'ekt",
};

/**
 * Daraxt vizualida har bir toifaga alohida shox rangi (3.2-bo'lim).
 * Qiymatlar globals.css da sahna bo'yicha (kun/bog') qayta belgilanadi —
 * shuning uchun bu yerda o'zgaruvchiga havola turadi, aniq rang emas.
 */
export const CATEGORY_COLORS: Record<IdeaCategory, string> = {
  personaj: "var(--cat-personaj)",
  makon: "var(--cat-makon)",
  voqea: "var(--cat-voqea)",
  his: "var(--cat-his)",
  sabab: "var(--cat-sabab)",
  oqibat: "var(--cat-oqibat)",
  vaqt: "var(--cat-vaqt)",
  obyekt: "var(--cat-obyekt)",
};

export const ELABORATION_KINDS = [
  "sifatlash",
  "sabab",
  "his",
  "tasvir",
  "dialog",
  "oqibat",
  "oxshatish",
] as const;

export const TASK_TYPES = {
  davom_ettirish: { label: "Davom ettirish", criterion: "fluency" as Criterion },
  almashtirish: { label: "Almashtirish", criterion: "flexibility" as Criterion },
  boshqa_koz: { label: "Boshqa ko'z", criterion: "originality" as Criterion },
  agar: { label: '"Agar..."', criterion: "flexibility" as Criterion },
  boyitish: { label: "Boyitish", criterion: "elaboration" as Criterion },
  muqobil_yakun: { label: "Muqobil yakun", criterion: "originality" as Criterion },
  yangi_personaj: { label: "Yangi personaj", criterion: "fluency" as Criterion },
  muammo_yechish: { label: "Muammo yechish", criterion: "fluency" as Criterion },
} as const;
export type TaskType = keyof typeof TASK_TYPES;

/** 4.2-bo'lim: sinflar bo'yicha kutilma darajasi. Pilotdan keyin qayta kalibrlanadi. */
export type Band = { min: number; max: number };
export type GradeCalibration = {
  fluency: Band;
  flexibility: Band;
  elaboration: Band;
  inputMethods: ("ovoz" | "matn" | "rasm")[];
  sessionMinutes: [number, number];
};

export const CALIBRATION: Record<1 | 2 | 3 | 4, GradeCalibration> = {
  1: {
    fluency: { min: 2, max: 3 },
    flexibility: { min: 1, max: 2 },
    elaboration: { min: 0, max: 1 },
    inputMethods: ["ovoz", "rasm"],
    sessionMinutes: [10, 12],
  },
  2: {
    fluency: { min: 3, max: 4 },
    flexibility: { min: 2, max: 3 },
    elaboration: { min: 1, max: 2 },
    inputMethods: ["ovoz", "matn"],
    sessionMinutes: [12, 15],
  },
  3: {
    fluency: { min: 4, max: 6 },
    flexibility: { min: 3, max: 4 },
    elaboration: { min: 2, max: 3 },
    inputMethods: ["matn", "ovoz"],
    sessionMinutes: [15, 20],
  },
  4: {
    fluency: { min: 5, max: 8 },
    flexibility: { min: 3, max: 5 },
    elaboration: { min: 3, max: 5 },
    inputMethods: ["matn"],
    sessionMinutes: [20, 25],
  },
};

export const LEVEL_LABELS: Record<number, string> = {
  4: "Yuqori",
  3: "Yetarli",
  2: "Rivojlanmoqda",
  1: "Qo'llab-quvvatlash kerak",
};

export const LEVEL_MEANINGS: Record<number, string> = {
  4: "Yosh normasidan sezilarli yuqori",
  3: "Yosh normasiga mos",
  2: "Normadan biroz past",
  1: "Maqsadli ish talab qiladi",
};

export function clampGrade(grade: number): 1 | 2 | 3 | 4 {
  if (grade <= 1) return 1;
  if (grade >= 4) return 4;
  return grade as 2 | 3;
}

/**
 * Xom o'lchovni 4 darajali shkalaga o'tkazadi.
 * Norma ichida = 3. Normadan yuqori = 4. Bittaga past = 2. Undan past = 1.
 */
export function levelFromBand(value: number, band: Band): number {
  if (value > band.max) return 4;
  if (value >= band.min) return 3;
  if (value >= band.min - 1) return 2;
  return 1;
}

/**
 * Originallik darajasi kamyoblik ko'rsatkichidan (0..1) kelib chiqadi.
 *
 * 25 kishilik sinfda bu shunday o'qiladi:
 *   4 — g'oyani 1–2 bola aytgan
 *   3 — 3–7 bola aytgan
 *   2 — 8–13 bola aytgan
 *   1 — 14 va undan ko'p bola aytgan ("bo'ri qochib ketdi" tipidagi javob)
 *
 * Chegaralar BOSHLANG'ICH taxmin (4.2-bo'lim) — pilotdan keyin real
 * taqsimot asosida qayta kalibrlanadi.
 *
 * peerCount — taqqoslash bazasidagi bolalar soni. Baza kichik bo'lsa
 * kamyoblik ishonchsiz: birinchi javob bergan bola avtomatik "4" olib
 * qolmasligi uchun daraja 3 bilan cheklanadi.
 */
export function levelFromRarity(rarity: number, peerCount = Number.POSITIVE_INFINITY): number {
  const level = rarity >= 0.9 ? 4 : rarity >= 0.7 ? 3 : rarity >= 0.45 ? 2 : 1;
  if (peerCount < 5) return Math.min(level, 3);
  return level;
}

/** Originallikni ishonchli hisoblash uchun kerakli minimal javoblar soni (13-bo'lim). */
export const MIN_RESPONSES_FOR_CLASS_RARITY = 15;

/**
 * G'oya matnini taqqoslash uchun normallashtiradi.
 * AI bergan canonical_key ustunlik qiladi; bu — zaxira/tozalash bosqichi.
 */
export function normalizeKey(text: string): string {
  return text
    .toLocaleLowerCase("uz")
    .replace(/[`'’‘ʻʼ]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
