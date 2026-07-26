import { notFound } from "next/navigation";
import { LessonFlow } from "@/components/LessonFlow";
import { prisma } from "@/lib/db";
import { TASK_TYPES, type TaskType } from "@/lib/torrance";
import { buildTree } from "@/lib/tree";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      student: { include: { classroom: true } },
      story: {
        include: {
          tasks: { orderBy: { order: "asc" } },
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!session) notFound();

  const tree = await buildTree(sessionId);

  return (
    <LessonFlow
      sessionId={session.id}
      studentName={`${session.student.firstName} ${session.student.lastInitial}.`}
      grade={session.student.classroom.grade}
      initialTree={tree}
      story={{
        id: session.story.id,
        title: session.story.title,
        summary: session.story.summary,
        paragraphs: session.story.body.split("\n\n"),
        questions: session.story.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: JSON.parse(question.options) as string[],
          correctIndex: question.correctIndex,
        })),
        tasks: session.story.tasks.map((task) => ({
          id: task.id,
          prompt: task.prompt,
          typeLabel: TASK_TYPES[task.type as TaskType]?.label ?? task.type,
        })),
      }}
    />
  );
}
