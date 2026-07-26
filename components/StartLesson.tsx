"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  // Ertak sinf darajasiga mos bo'lishi kerak — kutilma darajasi shu asosda kalibrlanadi.
  const suitable = classroom
    ? stories.filter((s) => s.gradeMin <= classroom.grade && s.gradeMax >= classroom.grade)
    : stories;

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
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="mb-3 font-bold">1. Sinf</h2>
        <div className="flex flex-wrap gap-2">
          {classrooms.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setClassroomId(item.id);
                setStudentId("");
                setStoryId("");
              }}
              className={`btn ${classroomId === item.id ? "btn-primary" : "btn-quiet"}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">2. O&apos;quvchi</h2>
        <div className="flex flex-wrap gap-2">
          {classroom?.students.map((student) => (
            <button
              key={student.id}
              onClick={() => setStudentId(student.id)}
              className={`btn ${studentId === student.id ? "btn-primary" : "btn-quiet"}`}
            >
              {student.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">3. Ertak</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {suitable.map((story) => (
            <button
              key={story.id}
              onClick={() => setStoryId(story.id)}
              className={`card p-4 text-left transition ${
                storyId === story.id ? "border-[var(--leaf-deep)] ring-2 ring-[var(--leaf)]" : ""
              }`}
            >
              <p className="font-bold">{story.title}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{story.summary}</p>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                {story.gradeMin}–{story.gradeMax}-sinf
              </p>
            </button>
          ))}
          {suitable.length === 0 && (
            <p className="text-[var(--ink-soft)]">Bu sinf darajasi uchun ertak yo&apos;q.</p>
          )}
        </div>
      </section>

      <button
        onClick={start}
        disabled={!studentId || !storyId || busy}
        className="btn btn-primary disabled:opacity-40"
      >
        {busy ? "Ochilyapti..." : "Boshlash"}
      </button>
    </div>
  );
}
