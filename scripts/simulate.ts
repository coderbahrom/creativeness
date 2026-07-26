/**
 * Sinov ma'lumotlari: 2-A sinf "Susambil" ertagi bo'yicha javob beradi.
 *
 * Maqsad — originallik matematikasini tekshirish: ko'pchilik bir xil g'oyani
 * aytadi (past kamyoblik), bir-ikki bola noyob g'oya aytadi (yuqori kamyoblik).
 *
 * Ishga tushirish: dev server ochiq bo'lganda `npx tsx scripts/simulate.ts`
 */

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

/** Ko'pchilik aytadigan javoblar — kamyoblik past bo'lishi kerak. */
const COMMON = [
  "Ertalab ular nonushta qilishdi. Keyin uyni tozalashdi.",
  "Ertalab quyosh chiqdi. Ular nonushta qilishdi va o'ynashdi.",
  "Ertalab ular nonushta qilishdi va bog'da o'tirishdi.",
  "Ular ertalab nonushta qilishdi. Keyin hovlini supurishdi.",
  "Ertalab turishdi va nonushta qilishdi. Keyin dam olishdi.",
];

/** Kam uchraydigan javoblar — kamyoblik yuqori bo'lishi kerak. */
const RARE = [
  "Ertalab bo'rilar eshik oldiga xat tashlab ketishdi. Xatda ular kechirim so'ragan edi, chunki ular ham sovuqda qolgan. Ho'kiz o'ylanib qoldi va ularni choyga chaqirdi.",
  "Ertalab kulbaning tomida bir qaldirg'och uya qurdi. Xo'roz uni qo'riqlashga va'da berdi, chunki o'zi ham bir vaqtlar uysiz qolgan edi.",
];

/** `--reset` bilan ishga tushirilsa, avvalgi sinov javoblari o'chiriladi. */
async function reset() {
  await prisma.assessment.deleteMany({});
  await prisma.idea.deleteMany({});
  await prisma.response.deleteMany({});
  await prisma.session.deleteMany({});
  console.log("Avvalgi javoblar tozalandi\n");
}

async function main() {
  if (process.argv.includes("--reset")) await reset();

  const classroom = await prisma.classroom.findFirst({ where: { name: "2-A sinf" } });
  const story = await prisma.story.findUnique({
    where: { slug: "susambil" },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  if (!classroom || !story) throw new Error("Seed ma'lumoti topilmadi — avval seed'ni ishga tushiring");

  const students = await prisma.student.findMany({ where: { classroomId: classroom.id } });
  const task = story.tasks[0];

  const answers = [...COMMON, ...COMMON, ...COMMON, ...RARE].slice(0, students.length);

  for (const [index, student] of students.entries()) {
    const answer = answers[index % answers.length];
    const sessionRes = await fetch(`${BASE}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId: student.id, storyId: story.id }),
    });
    const session = (await sessionRes.json()) as { id: string };

    const res = await fetch(`${BASE}/api/responses`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: session.id,
        taskId: task.id,
        text: answer,
        inputMethod: "matn",
      }),
    });
    if (!res.ok) {
      console.error(`${student.firstName}: ${res.status} ${await res.text()}`);
      continue;
    }
    const data = (await res.json()) as { tree: { totalIdeas: number; totalFlowers: number } };
    console.log(
      `${student.firstName} ${student.lastInitial}. → ${data.tree.totalIdeas} shox, ${data.tree.totalFlowers} gul`,
    );
  }

  const assessments = await prisma.assessment.findMany({
    where: { response: { taskId: task.id } },
    include: { response: { include: { student: true } } },
    orderBy: { rarityScore: "desc" },
  });
  console.log("\nKamyoblik reytingi:");
  for (const a of assessments) {
    console.log(
      `  ${(a.rarityScore * 100).toFixed(0)}%  ${a.response.student.firstName}  ` +
        `[R${a.fluency} M${a.flexibility} O${a.originality} B${a.elaboration}] baza: ${a.originalityBase}`,
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
