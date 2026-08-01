"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

/**
 * Server action middleware'dan tashqarida ham chaqirilishi mumkin,
 * shuning uchun har bir mutatsiya rolni o'zi tekshiradi.
 */
async function requireAdmin() {
  const jar = await cookies();
  const role = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (role !== "admin") throw new Error("Ruxsat yo'q");
}

export async function addClassroom(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const grade = Math.min(4, Math.max(1, Number(formData.get("grade") ?? 1)));
  if (!name || name.length > 30) return;
  await prisma.classroom.create({ data: { name, grade } });
  revalidatePath("/admin/sinflar");
}

/**
 * O'quvchini barcha izlari bilan o'chirish: javoblar (g'oyalar va baholar
 * kaskad bilan ketadi), sessiyalar, so'ng o'quvchining o'zi.
 * Bu 12-bo'limdagi "ma'lumotni o'chirishni talab qilish" huquqining ham asosi.
 */
async function purgeStudent(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], studentId: string) {
  await tx.response.deleteMany({ where: { studentId } });
  await tx.session.deleteMany({ where: { studentId } });
  await tx.student.delete({ where: { id: studentId } });
}

export async function deleteClassroom(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const students = await prisma.student.findMany({ where: { classroomId: id } });
  // Kaskadli o'chirish — UI da tasdiqlash dialogi bor
  await prisma.$transaction(async (tx) => {
    for (const student of students) await purgeStudent(tx, student.id);
    await tx.classroom.delete({ where: { id } });
  });
  revalidatePath("/admin/sinflar");
  revalidatePath("/oqituvchi");
}

export async function addStudent(formData: FormData) {
  await requireAdmin();
  const classroomId = String(formData.get("classroomId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  // 12-bo'lim: to'liq familiya saqlanmaydi — faqat bosh harf
  const lastInitial = String(formData.get("lastInitial") ?? "")
    .trim()
    .slice(0, 1)
    .toUpperCase();
  if (!firstName || firstName.length > 30 || !lastInitial) return;
  await prisma.student.create({ data: { classroomId, firstName, lastInitial } });
  revalidatePath("/admin/sinflar");
}

export async function deleteStudent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.$transaction(async (tx) => {
    await purgeStudent(tx, id);
  });
  revalidatePath("/admin/sinflar");
  revalidatePath("/oqituvchi");
}
