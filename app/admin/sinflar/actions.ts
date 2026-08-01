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

export async function deleteClassroom(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const students = await prisma.student.count({ where: { classroomId: id } });
  // O'quvchisi bor sinf o'chirilmaydi — bolalar ma'lumoti bexosdan yo'qolmasin
  if (students > 0) return;
  await prisma.classroom.delete({ where: { id } });
  revalidatePath("/admin/sinflar");
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
  const responses = await prisma.response.count({ where: { studentId: id } });
  // Javoblari bor o'quvchini o'chirish — ma'lumotni o'chirish talabi bilan
  // birga hal qilinadi (12-bo'lim, 7-band). Hozircha bloklaymiz.
  if (responses > 0) return;
  await prisma.session.deleteMany({ where: { studentId: id } });
  await prisma.student.delete({ where: { id } });
  revalidatePath("/admin/sinflar");
}
