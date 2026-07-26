import { prisma } from "./db";
import { computeRarity } from "./scoring";
import type { IdeaCategory } from "./torrance";

/**
 * Daraxt — baholash natijasining vizual ifodasi (3.2-bo'lim).
 *   Shox            → Ravonlik        (har bir tugallangan g'oya)
 *   Shox rangi      → Moslashuvchanlik (g'oya toifasi)
 *   Gul             → Originallik      (sinfda kam uchragan g'oya)
 *   Barg / meva     → Batafsillik      (tafsilot birligi)
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
    include: { ideas: { orderBy: { order: "asc" } } },
  });

  const branches: TreeBranch[] = [];
  for (const response of responses) {
    if (!response.ideas.length) continue;
    const { perIdea } = await computeRarity(response.id);
    const rarityByKey = new Map(perIdea.map((i) => [i.key, i.rarity]));
    for (const idea of response.ideas) {
      branches.push({
        id: idea.id,
        category: idea.category as IdeaCategory,
        flower: (rarityByKey.get(idea.canonicalKey) ?? 0) >= FLOWER_RARITY_THRESHOLD,
        leaves: idea.elaborationCount,
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
