import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { CLASSROOMS, STORIES } from "./stories";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

async function main() {
  for (const story of STORIES) {
    const existing = await prisma.story.findUnique({ where: { slug: story.slug } });
    if (existing) {
      await prisma.task.deleteMany({ where: { storyId: existing.id, responses: { none: {} } } });
      await prisma.comprehensionQuestion.deleteMany({ where: { storyId: existing.id } });
      await prisma.story.delete({ where: { id: existing.id } }).catch(() => {
        console.log(`  "${story.title}" javoblari bor — o'tkazib yuborildi`);
      });
    }
    const created = await prisma.story.create({
      data: {
        slug: story.slug,
        title: story.title,
        gradeMin: story.gradeMin,
        gradeMax: story.gradeMax,
        summary: story.summary,
        body: story.body,
        questions: { create: story.questions.map((q) => ({ ...q, options: JSON.stringify(q.options) })) },
        tasks: { create: story.tasks },
      },
    });
    console.log(`Ertak: ${created.title} (${story.tasks.length} topshiriq)`);
  }

  for (const classroom of CLASSROOMS) {
    const exists = await prisma.classroom.findFirst({ where: { name: classroom.name } });
    if (exists) {
      console.log(`Sinf: ${classroom.name} — allaqachon bor`);
      continue;
    }
    const created = await prisma.classroom.create({
      data: {
        name: classroom.name,
        grade: classroom.grade,
        students: {
          create: classroom.students.map(([firstName, lastInitial]) => ({ firstName, lastInitial })),
        },
      },
    });
    console.log(`Sinf: ${created.name} (${classroom.students.length} o'quvchi)`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
