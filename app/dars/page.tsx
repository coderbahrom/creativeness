import { prisma } from "@/lib/db";
import { StartLesson } from "@/components/StartLesson";

export const dynamic = "force-dynamic";

export default async function DarsPage() {
  const [classrooms, stories] = await Promise.all([
    prisma.classroom.findMany({
      orderBy: { grade: "asc" },
      include: { students: { orderBy: { firstName: "asc" } } },
    }),
    prisma.story.findMany({ orderBy: { gradeMin: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-extrabold">Darsni boshlash</h1>
      <p className="mt-2 text-[var(--ink-soft)]">
        Sinf, o&apos;quvchi va ertakni tanlang. Tayyorgarlik shart emas.
      </p>
      <StartLesson
        classrooms={classrooms.map((classroom) => ({
          id: classroom.id,
          name: classroom.name,
          grade: classroom.grade,
          students: classroom.students.map((student) => ({
            id: student.id,
            name: `${student.firstName} ${student.lastInitial}.`,
          })),
        }))}
        stories={stories.map((story) => ({
          id: story.id,
          title: story.title,
          gradeMin: story.gradeMin,
          gradeMax: story.gradeMax,
          summary: story.summary,
        }))}
      />
    </main>
  );
}
