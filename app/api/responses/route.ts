import { NextResponse } from "next/server";
import { analyzeResponse } from "@/lib/analyze";
import { prisma } from "@/lib/db";
import { recomputeTaskScores, scoreTask } from "@/lib/scoring";
import { buildTree } from "@/lib/tree";
import type { Criterion } from "@/lib/torrance";

/** Bitta sessiyada AI maksimum 3 ta savol beradi (7.3-bo'lim). */
const MAX_QUESTIONS_PER_SESSION = 3;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId?: string;
    taskId?: string;
    text?: string;
    inputMethod?: string;
    followUpOf?: string;
  };

  if (!body.sessionId || !body.taskId || !body.text?.trim()) {
    return NextResponse.json({ error: "sessionId, taskId va text kerak" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({
    where: { id: body.sessionId },
    include: {
      student: { include: { classroom: true } },
      story: true,
      responses: {
        orderBy: { createdAt: "asc" },
        include: { assessment: true, ideas: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!session) return NextResponse.json({ error: "Sessiya topilmadi" }, { status: 404 });

  const task = await prisma.task.findUnique({ where: { id: body.taskId } });
  if (!task) return NextResponse.json({ error: "Topshiriq topilmadi" }, { status: 404 });

  const askedQuestions = session.responses
    .map((r) => r.assessment?.aiQuestion)
    .filter((q): q is string => Boolean(q));

  // Shu topshiriqqa bola oldin yozganlari — bu javob o'sha ishning davomi
  const earlier = session.responses.filter(
    (r) => r.taskId === task.id && !r.assessment?.safetyFlagged,
  );
  const lastQuestion =
    [...earlier].reverse().find((r) => r.assessment?.aiQuestion)?.assessment?.aiQuestion ?? null;

  const analysis = await analyzeResponse({
    grade: session.student.classroom.grade,
    storyTitle: session.story.title,
    storyBody: session.story.body,
    taskPrompt: task.prompt,
    taskCriterion: task.criterion as Criterion,
    answer: body.text.trim(),
    previousQuestions: askedQuestions,
    thread: earlier.length
      ? {
          earlierAnswers: earlier.map((r) => r.rawText),
          question: body.followUpOf ? lastQuestion : null,
          earlierIdeas: [
            ...new Map(
              earlier.flatMap((r) => r.ideas).map((i) => [i.canonicalKey, { key: i.canonicalKey, text: i.text }]),
            ).values(),
          ],
        }
      : undefined,
  });

  const response = await prisma.response.create({
    data: {
      sessionId: session.id,
      taskId: task.id,
      studentId: session.studentId,
      rawText: body.text.trim(),
      inputMethod: body.inputMethod ?? "matn",
      followUpOf: body.followUpOf ?? null,
      ideas: {
        create: analysis.ideas.map((idea, index) => ({
          order: index,
          text: idea.text,
          category: idea.category,
          canonicalKey: idea.canonical_key,
          elaborationCount: idea.elaboration_count,
          elaborationKinds: JSON.stringify(idea.elaboration_kinds),
        })),
      },
    },
  });

  // Baho — butun ish bo'yicha (shu topshiriqdagi hamma yozganlar), faqat shu bo'lak emas
  const scores = await scoreTask(session.id, task.id);
  if (!scores) throw new Error("Ish topilmadi");

  // Xavfsizlik filtri ishga tushsa: ball ham, AI savoli ham berilmaydi (7.4-bo'lim).
  const flagged = analysis.safety.flagged;
  const canAsk = !flagged && askedQuestions.length < MAX_QUESTIONS_PER_SESSION && analysis.question;

  await prisma.assessment.create({
    data: {
      responseId: response.id,
      fluency: flagged ? 0 : scores.fluency,
      flexibility: flagged ? 0 : scores.flexibility,
      originality: flagged ? 0 : scores.originality,
      elaboration: flagged ? 0 : scores.elaboration,
      // AI bahosining o'zgarmas nusxasi — o'qituvchi tahriri bunga tegmaydi
      aiFluency: flagged ? 0 : scores.fluency,
      aiFlexibility: flagged ? 0 : scores.flexibility,
      aiOriginality: flagged ? 0 : scores.originality,
      aiElaboration: flagged ? 0 : scores.elaboration,
      ideaCount: scores.ideaCount,
      categoryCount: scores.categoryCount,
      detailCount: scores.detailCount,
      rarityScore: scores.rarityScore,
      originalityBase: scores.originalityBase,
      aiQuestion: canAsk ? analysis.question : null,
      aiRationale: analysis.rationale,
      safetyFlagged: flagged,
      safetyNote: flagged ? analysis.safety.note : null,
      model: analysis.model,
    },
  });

  // Yangi javob kelishi bilan sinf ichidagi kamyoblik ulushlari siljiydi.
  await recomputeTaskScores(task.id);

  const tree = await buildTree(session.id);

  return NextResponse.json({
    responseId: response.id,
    question: canAsk ? analysis.question : null,
    questionsAsked: askedQuestions.length + (canAsk ? 1 : 0),
    flagged,
    tree,
  });
}
