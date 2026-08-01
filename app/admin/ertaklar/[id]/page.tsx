import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StoryForm } from "../StoryForm";

export const dynamic = "force-dynamic";

export default async function ErtakTahrirPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ xato?: string; saqlandi?: string }>;
}) {
  const { id } = await params;
  const { xato, saqlandi } = await searchParams;

  const story = await prisma.story.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      tasks: {
        orderBy: { order: "asc" },
        include: { _count: { select: { responses: true } } },
      },
    },
  });
  if (!story) notFound();

  const editable = story.tasks.filter((t) => t._count.responses === 0);
  const locked = story.tasks.filter((t) => t._count.responses > 0);

  return (
    <>
      <h1 className="text-3xl font-extrabold">{story.title}</h1>
      {saqlandi && (
        <p role="status" className="mt-3 font-bold text-[var(--leaf-deep)]">
          Saqlandi.
        </p>
      )}
      <StoryForm
        xato={xato}
        story={{
          id: story.id,
          title: story.title,
          summary: story.summary,
          body: story.body,
          gradeMin: story.gradeMin,
          gradeMax: story.gradeMax,
          published: story.published,
          pdfPath: story.pdfPath,
          questions: story.questions.map((q) => ({
            prompt: q.prompt,
            options: JSON.parse(q.options) as string[],
            correctIndex: q.correctIndex,
          })),
          tasks: editable.map((t) => ({ type: t.type, prompt: t.prompt })),
          lockedTasks: locked.map((t) => ({
            type: t.type,
            prompt: t.prompt,
            responseCount: t._count.responses,
          })),
        }}
      />
    </>
  );
}
