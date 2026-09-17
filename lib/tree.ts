import { prisma } from "./db";
import { loadTaskPool, mergeIdeas, rarityFor } from "./scoring";
import type { IdeaCategory } from "./torrance";

/**
 * Daraxt — baholash natijasining vizual ifodasi (3.2-bo'lim).
 *   Shox            → Ravonlik        (har bir tugallangan g'oya)
 *   Shox rangi      → Moslashuvchanlik (g'oya toifasi)
 *   Gul             → Originallik      (sinfda kam uchragan g'oya)
 *   Barg / meva     → Batafsillik      (tafsilot birligi)
 *
 * Daraxt baho bilan bir xil birlikda quriladi: bitta topshiriq ichida bola
 * g'oyani qayta aytsa yoki Ertakchi savoliga javobda unga tafsilot qo'shsa —
 * yangi shox chiqmaydi, mavjud shoxga barg qo'shiladi.
 *
 * Daraxt hech qachon qurimaydi va yaproq to'kmaydi — salbiy fidbek vizual jazo
 * shaklida berilmaydi.
 */

export type TreeBranch = {
  id: string;
  category: IdeaCategory;
  /** Sinfda kam uchragan g'oya gul beradi */
  flower: boolean;
  /** Shu g'oyaga qo'shilgan tafsilotlar — barglar */
  leaves: number;
};

export type TreeState = {
  branches: TreeBranch[];
  totalIdeas: number;
  totalLeaves: number;
  totalFlowers: number;
  categories: IdeaCategory[];
};

/** Gul faqat haqiqatan kam uchragan g'oyaga beriladi (originallik 3-daraja chegarasi). */
export const FLOWER_RARITY_THRESHOLD = 0.7;

export async function buildTree(sessionId: string): Promise<TreeState> {
  const responses = await prisma.response.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      taskId: true,
      studentId: true,
      createdAt: true,
      assessment: { select: { safetyFlagged: true } },
      ideas: {
        orderBy: { order: "asc" },
        select: { canonicalKey: true, text: true, category: true, elaborationCount: true },
      },
    },
  });

  // Topshiriqlar javob berilgan tartibda
  const taskOrder = [...new Set(responses.map((r) => r.taskId))];
  const branches: TreeBranch[] = [];

  for (const taskId of taskOrder) {
    const group = responses.filter((r) => r.taskId === taskId);
    const ideas = mergeIdeas(group);
    if (!ideas.length) continue;

    const { perIdea } = rarityFor(await loadTaskPool(taskId), group[0].studentId, ideas);
    const rarityByKey = new Map(perIdea.map((i) => [i.key, i.rarity]));

    for (const idea of ideas) {
      branches.push({
        // Kalit barqaror: davom javobi kelganda shox qayta "o'smaydi", faqat barg qo'shiladi
        id: `${taskId}:${idea.key}`,
        category: idea.category as IdeaCategory,
        flower: (rarityByKey.get(idea.key) ?? 0) >= FLOWER_RARITY_THRESHOLD,
        leaves: idea.elaboration,
      });
    }
  }

  return {
    branches,
    totalIdeas: branches.length,
    totalLeaves: branches.reduce((sum, b) => sum + b.leaves, 0),
    totalFlowers: branches.filter((b) => b.flower).length,
    categories: [...new Set(branches.map((b) => b.category))],
  };
}
