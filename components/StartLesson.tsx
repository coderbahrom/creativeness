"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Darsni boshlash: sinf → o'quvchi → ertak. O'qituvchiga berilgan va'da —
 * tayyorgarlik 0 daqiqa (5-bo'lim), shuning uchun uch bosish va tamom.
 */

type Classroom = {
  id: string;
  name: string;
  grade: number;
  students: { id: string; name: string }[];
};
type Story = {
  id: string;
  title: string;
  gradeMin: number;
  gradeMax: number;
  summary: string;
};

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-sunk)] font-extrabold text-[var(--ink-soft)]"
        >
          {n}
        </span>
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {hint && <p className="text-sm text-[var(--ink-soft)]">{hint}</p>}
        </div>
      </div>
      <div className="sm:pl-12">{children}</div>
    </section>
  );
}

export function StartLesson({
  classrooms,
  stories,
}: {
  classrooms: Classroom[];
  stories: Story[];
}) {
  const router = useRouter();
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id ?? "");
  const [studentId, setStudentId] = useState("");
  const [storyId, setStoryId] = useState("");
  const [busy, setBusy] = useState(false);

  const classroom = classrooms.find((c) => c.id === classroomId);
  const student = classroom?.students.find((s) => s.id === studentId);
  // Ertak sinf darajasiga mos bo'lishi kerak — kutilma darajasi shu asosda kalibrlanadi.
  const suitable = classroom
    ? stories.filter((s) => s.gradeMin <= classroom.grade && s.gradeMax >= classroom.grade)
    : stories;
  const story = suitable.find((s) => s.id === storyId);

  async function start() {
    if (!studentId || !storyId) return;
    setBusy(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, storyId }),
    });
    const data = (await res.json()) as { id: string };
    router.push(`/dars/${data.id}`);
  }

  return (
    <div className="space-y-9 pb-28">
      <Step n={1} title="Sinf" hint="Kutilma darajasi sinfga qarab hisoblanadi.">
        <div className="flex flex-wrap gap-2">
          {classrooms.map((item) => (
            <button
              key={item.id}
              aria-pressed={classroomId === item.id}
              onClick={() => {
                setClassroomId(item.id);
                setStudentId("");
                setStoryId("");
              }}
              className="btn btn-quiet"
            >
              {item.name}
            </button>
          ))}
        </div>
      </Step>

      <Step n={2} title="O'quvchi" hint="Tizimda faqat ism va familiya bosh harfi saqlanadi.">
        <div className="flex flex-wrap gap-2">
          {classroom?.students.map((item) => (
            <button
              key={item.id}
              aria-pressed={studentId === item.id}
              onClick={() => setStudentId(item.id)}
              className="btn btn-quiet"
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--leaf)_30%,transparent)] text-xs font-extrabold"
              >
                {item.name.slice(0, 1)}
              </span>
              {item.name}
            </button>
          ))}
          {classroom?.students.length === 0 && (
            <p className="text-[var(--ink-soft)]">Bu sinfda o&apos;quvchi yo&apos;q.</p>
          )}
        </div>
      </Step>

      <Step n={3} title="Ertak">
        <div className="grid gap-3 sm:grid-cols-2">
          {suitable.map((item) => {
            const selected = storyId === item.id;
            return (
              <button
                key={item.id}
                aria-pressed={selected}
                onClick={() => setStoryId(item.id)}
                className={`card p-5 text-left transition hover:-translate-y-0.5 ${
                  selected
                    ? "border-[var(--leaf)] ring-2 ring-[var(--leaf)]"
                    : "hover:border-[var(--line-strong)]"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-extrabold">{item.title}</p>
                  <span className="shrink-0 rounded-full bg-[var(--surface-sunk)] px-2.5 py-0.5 text-xs font-bold text-[var(--ink-soft)]">
                    {item.gradeMin}–{item.gradeMax}-sinf
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{item.summary}</p>
              </button>
            );
          })}
          {suitable.length === 0 && (
            <p className="text-[var(--ink-soft)]">
              Bu sinf darajasi uchun ertak yo&apos;q. Boshqa sinfni tanlang.
            </p>
          )}
        </div>
      </Step>

      <div
        className="fixed inset-x-0 bottom-0 border-t border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur"
        style={{ zIndex: "var(--z-rail)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3">
          <p className="min-w-0 flex-1 truncate text-sm text-[var(--ink-soft)]">
            {student && story ? (
              <>
                <span className="font-bold text-[var(--ink)]">{student.name}</span> —{" "}
                {story.title}
              </>
            ) : !student ? (
              "O'quvchini tanlang"
            ) : (
              "Ertakni tanlang"
            )}
          </p>
          <button
            onClick={start}
            disabled={!studentId || !storyId || busy}
            className="btn btn-primary"
          >
            {busy ? "Ochilyapti..." : "Boshlash"}
          </button>
        </div>
      </div>
    </div>
  );
}
