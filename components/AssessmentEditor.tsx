"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CRITERION_LABELS, LEVEL_LABELS } from "@/lib/torrance";

const CRITERIA = ["fluency", "flexibility", "originality", "elaboration"] as const;
type Levels = Record<(typeof CRITERIA)[number], number>;

/**
 * O'qituvchi har qanday bahoni bir bosishda o'zgartira oladi (9.5-bo'lim).
 * O'zgartirish eslab qolinadi va keyingi avtomatik qayta hisoblashlar
 * bu bahoga tegmaydi.
 */
export function AssessmentEditor({
  assessmentId,
  initial,
  initialNote,
  edited,
  flagged,
}: {
  assessmentId: string;
  initial: Levels;
  initialNote: string | null;
  edited: boolean;
  flagged: boolean;
}) {
  const router = useRouter();
  const [levels, setLevels] = useState<Levels>(initial);
  const [note, setNote] = useState(initialNote ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function save(next: Partial<Levels & { teacherNote: string; safetyResolved: boolean }>) {
    setState("saving");
    await fetch(`/api/assessments/${assessmentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    setState("saved");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map((criterion) => (
          <label key={criterion} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--ink-soft)]">{CRITERION_LABELS[criterion]}</span>
            <select
              value={levels[criterion]}
              onChange={(event) => {
                const value = Number(event.target.value);
                setLevels({ ...levels, [criterion]: value });
                void save({ [criterion]: value } as Partial<Levels>);
              }}
              className="card px-2 py-1"
            >
              {[4, 3, 2, 1].map((level) => (
                <option key={level} value={level}>
                  {level} — {LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onBlur={() => note !== (initialNote ?? "") && save({ teacherNote: note })}
        rows={2}
        placeholder="O'qituvchi izohi (ota-onaga ko'rsatish uchun)"
        className="card w-full p-3 text-sm outline-none focus:border-[var(--leaf-deep)]"
      />

      <div className="flex items-center gap-3 text-sm">
        {flagged && (
          <button className="btn btn-quiet text-sm" onClick={() => save({ safetyResolved: true })}>
            Ko&apos;rib chiqildi
          </button>
        )}
        <span className="text-[var(--ink-soft)]">
          {state === "saving"
            ? "Saqlanyapti..."
            : state === "saved"
              ? "Saqlandi"
              : edited
                ? "Siz tahrirlagansiz"
                : "AI bahosi"}
        </span>
      </div>
    </div>
  );
}
