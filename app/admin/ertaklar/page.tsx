import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteStory, togglePublished } from "./actions";

export const dynamic = "force-dynamic";

export default async function ErtaklarPage() {
  const stories = await prisma.story.findMany({
    orderBy: [{ gradeMin: "asc" }, { title: "asc" }],
    include: { _count: { select: { sessions: true, tasks: true } } },
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-extrabold">Ertaklar</h1>
        <Link href="/admin/ertaklar/yangi" className="btn btn-primary ml-auto">
          Yangi ertak
        </Link>
      </div>
      <p className="mt-2 text-[var(--ink-soft)]">
        O&apos;quvchi darsda faqat e&apos;lon qilingan ertaklarni ko&apos;radi. Dars
        o&apos;tilgan ertak o&apos;chirilmaydi.
      </p>

      <ul className="mt-8 space-y-3">
        {stories.map((story) => (
          <li key={story.id} className="card flex flex-wrap items-center gap-x-5 gap-y-2 p-5">
            <div className="min-w-0">
              <Link
                href={`/admin/ertaklar/${story.id}`}
                className="font-extrabold hover:underline"
              >
                {story.title}
              </Link>
              <p className="text-sm text-[var(--ink-soft)]">
                {story.gradeMin}–{story.gradeMax}-sinf · {story._count.tasks} topshiriq ·{" "}
                {story._count.sessions} dars
                {story.pdfPath && " · PDF bor"}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <form action={togglePublished}>
                <input type="hidden" name="id" value={story.id} />
                <button
                  type="submit"
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    story.published
                      ? "bg-[color-mix(in_oklab,var(--leaf)_25%,transparent)] text-[var(--ink)]"
                      : "border border-[var(--line-strong)] text-[var(--ink-soft)]"
                  }`}
                >
                  {story.published ? "E'lon qilingan" : "Qoralama"}
                </button>
              </form>
              {story._count.sessions === 0 && (
                <form action={deleteStory}>
                  <input type="hidden" name="id" value={story.id} />
                  <button type="submit" className="text-sm font-bold text-[var(--warn)] hover:underline">
                    O&apos;chirish
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
        {stories.length === 0 && (
          <li className="text-[var(--ink-soft)]">Hali ertak yo&apos;q — birinchisini qo&apos;shing.</li>
        )}
      </ul>
    </>
  );
}
