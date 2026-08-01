"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";
import { TASK_TYPES, type TaskType } from "@/lib/torrance";

async function requireAdmin() {
  const jar = await cookies();
  const role = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (role !== "admin") throw new Error("Ruxsat yo'q");
}

const MAX_PDF_BYTES = 15 * 1024 * 1024;

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replaceAll("'", "")
      .replaceAll("g'", "g")
      .replaceAll("o'", "o")
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `ertak-${Date.now()}`
  );
}

/** PDFdan matn olish — formani oldindan to'ldirish uchun yordamchi, manba emas. */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  // PDF qatorlarini paragraflarga yig'ish: bo'sh qator — paragraf chegarasi
  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

export type StorySaveResult = { xato?: string };

export async function saveStory(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  let body = String(formData.get("body") ?? "").trim();
  const gradeMin = Math.min(4, Math.max(1, Number(formData.get("gradeMin") ?? 1)));
  const gradeMax = Math.min(4, Math.max(gradeMin, Number(formData.get("gradeMax") ?? gradeMin)));
  const published = formData.get("published") === "on";

  // PDF: asl nusxa sifatida saqlanadi; matn bo'sh bo'lsa undan olishga urinamiz
  let pdfPath: string | undefined;
  const pdf = formData.get("pdf");
  if (pdf instanceof File && pdf.size > 0) {
    if (pdf.size > MAX_PDF_BYTES || !pdf.name.toLowerCase().endsWith(".pdf")) {
      redirect(`/admin/ertaklar${id ? `/${id}` : "/yangi"}?xato=pdf`);
    }
    const buffer = Buffer.from(await pdf.arrayBuffer());
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const filename = `${slugify(title || "ertak")}-${Date.now()}.pdf`;
    await writeFile(path.join(dir, filename), buffer);
    pdfPath = `/uploads/${filename}`;

    if (!body) {
      try {
        body = await extractPdfText(buffer);
      } catch {
        // Ajratib bo'lmadi — admin matnni qo'lda kiritadi
      }
    }
  }

  if (!title || !summary || !body) {
    redirect(`/admin/ertaklar${id ? `/${id}` : "/yangi"}?xato=maydon`);
  }

  // Savollar: 3 tagacha, bo'sh qoldirilgani tashlab yuboriladi
  const questions: { prompt: string; options: string[]; correctIndex: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const prompt = String(formData.get(`q${i}_prompt`) ?? "").trim();
    const options = String(formData.get(`q${i}_options`) ?? "")
      .split("\n")
      .map((o) => o.trim())
      .filter(Boolean);
    const correctIndex = Number(formData.get(`q${i}_correct`) ?? 1) - 1;
    if (!prompt || options.length < 2) continue;
    questions.push({
      prompt,
      options,
      correctIndex: Math.min(options.length - 1, Math.max(0, correctIndex)),
    });
  }

  // Topshiriqlar: 6 tagacha; mezon turdan avtomatik olinadi
  const tasks: { type: TaskType; prompt: string; criterion: string }[] = [];
  for (let i = 0; i < 6; i++) {
    const type = String(formData.get(`t${i}_type`) ?? "") as TaskType;
    const prompt = String(formData.get(`t${i}_prompt`) ?? "").trim();
    if (!prompt || !(type in TASK_TYPES)) continue;
    tasks.push({ type, prompt, criterion: TASK_TYPES[type].criterion });
  }
  if (tasks.length === 0) {
    redirect(`/admin/ertaklar${id ? `/${id}` : "/yangi"}?xato=topshiriq`);
  }

  const base = { title, summary, body, gradeMin, gradeMax, published, ...(pdfPath && { pdfPath }) };

  const storyId = await prisma.$transaction(async (tx) => {
    let sid = id;
    if (id) {
      await tx.story.update({ where: { id }, data: base });
      // Javob bog'langan topshiriqlar o'chirilmaydi — faqat javobsizlari yangilanadi
      const existing = await tx.task.findMany({
        where: { storyId: id },
        include: { _count: { select: { responses: true } } },
      });
      const removable = existing.filter((t) => t._count.responses === 0).map((t) => t.id);
      await tx.task.deleteMany({ where: { id: { in: removable } } });
      const keptCount = existing.length - removable.length;
      await tx.comprehensionQuestion.deleteMany({ where: { storyId: id } });
      await tx.task.createMany({
        data: tasks.map((t, order) => ({ ...t, storyId: id, order: keptCount + order })),
      });
    } else {
      const story = await tx.story.create({
        data: { ...base, slug: slugify(title) },
      });
      sid = story.id;
      await tx.task.createMany({
        data: tasks.map((t, order) => ({ ...t, storyId: sid, order })),
      });
    }
    if (questions.length) {
      await tx.comprehensionQuestion.createMany({
        data: questions.map((q, order) => ({
          storyId: sid,
          order,
          prompt: q.prompt,
          options: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
        })),
      });
    }
    return sid;
  });

  revalidatePath("/admin/ertaklar");
  revalidatePath("/dars");
  redirect(`/admin/ertaklar/${storyId}?saqlandi=1`);
}

export async function togglePublished(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) return;
  await prisma.story.update({ where: { id }, data: { published: !story.published } });
  revalidatePath("/admin/ertaklar");
  revalidatePath("/dars");
}

export async function deleteStory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const sessions = await prisma.session.count({ where: { storyId: id } });
  // O'quvchi ishlagan ertak o'chirilmaydi — javoblar tarixi buziladi
  if (sessions > 0) return;
  await prisma.$transaction([
    prisma.comprehensionQuestion.deleteMany({ where: { storyId: id } }),
    prisma.task.deleteMany({ where: { storyId: id } }),
    prisma.story.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/ertaklar");
  revalidatePath("/dars");
}
