import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [classroomCount, studentCount, storyCount, publishedCount, responseCount, flagged] =
    await Promise.all([
      prisma.classroom.count(),
      prisma.student.count(),
      prisma.story.count(),
      prisma.story.count({ where: { published: true } }),
      prisma.response.count(),
      prisma.assessment.count({ where: { safetyFlagged: true } }),
    ]);

  return (
    <>
      <h1 className="text-3xl font-extrabold">Boshqaruv</h1>
      <p className="mt-2 text-[var(--ink-soft)]">
        Sinf va o&apos;quvchilarni qo&apos;shing, ertak joylang — o&apos;quvchi darsda faqat
        e&apos;lon qilingan ertaklarni ko&apos;radi.
      </p>

      {flagged > 0 && (
        <p className="mt-5 rounded-xl border border-[var(--warn)] bg-[var(--surface)] px-4 py-3 font-bold text-[var(--warn)]">
          {flagged} ta javob alohida belgilangan —{" "}
          <Link href="/oqituvchi" className="underline">
            o&apos;qituvchi panelida ko&apos;ring
          </Link>
          .
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/sinflar"
          className="card block p-6 transition hover:-translate-y-0.5 hover:border-[var(--leaf)]"
        >
          <h2 className="text-xl font-extrabold">Sinflar va o&apos;quvchilar</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            {classroomCount} ta sinf · {studentCount} ta o&apos;quvchi
          </p>
          <span className="mt-4 inline-block font-bold text-[var(--leaf-deep)]">Boshqarish →</span>
        </Link>
        <Link
          href="/admin/ertaklar"
          className="card block p-6 transition hover:-translate-y-0.5 hover:border-[var(--leaf)]"
        >
          <h2 className="text-xl font-extrabold">Ertaklar</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            {storyCount} ta ertak, {publishedCount} tasi e&apos;lon qilingan ·{" "}
            {responseCount} ta o&apos;quvchi javobi
          </p>
          <span className="mt-4 inline-block font-bold text-[var(--leaf-deep)]">Boshqarish →</span>
        </Link>
      </div>
    </>
  );
}
