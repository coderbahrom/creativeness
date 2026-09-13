import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LiveLesson } from "@/components/LiveLesson";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LiveLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ sinf?: string }>;
}) {
  const { sinf } = await searchParams;
  const classrooms = await prisma.classroom.findMany({ orderBy: { grade: "asc" } });
  if (!classrooms.length) notFound();

  const classroom = sinf ? classrooms.find((c) => c.id === sinf) : classrooms[0];
  if (!classroom) redirect("/oqituvchi/dars");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Breadcrumb
          items={[{ href: "/oqituvchi", label: "Sinflar" }, { label: "Dars ekrani" }]}
        />

        <header className="mt-4">
          <h1 className="text-3xl font-extrabold sm:text-4xl">Dars ekrani</h1>
          <p className="mt-1 text-[var(--ink-soft)]">
            Dars vaqtida ochiq turadi: kim ishlayapti, kim qotib qolgan, kim tugatdi.
          </p>
        </header>

        {classrooms.length > 1 && (
          <nav aria-label="Sinf tanlash" className="mt-6 flex flex-wrap gap-2">
            {classrooms.map((item) => {
              const on = item.id === classroom.id;
              return (
                <a
                  key={item.id}
                  href={`/oqituvchi/dars?sinf=${item.id}`}
                  aria-current={on ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    on
                      ? "bg-[var(--btn-bg)] text-[var(--btn-ink)]"
                      : "border border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--leaf)] hover:text-[var(--ink)]"
                  }`}
                >
                  {item.name}
                </a>
              );
            })}
          </nav>
        )}

        <div className="mt-6">
          <LiveLesson classroomId={classroom.id} />
        </div>
      </main>
    </>
  );
}
