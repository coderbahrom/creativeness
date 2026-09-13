"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CRITERION_HINTS, CRITERION_LABELS, LEVEL_LABELS, LEVEL_MEANINGS } from "@/lib/torrance";

const CRITERIA = ["fluency", "flexibility", "originality", "elaboration"] as const;
type Levels = Record<(typeof CRITERIA)[number], number>;

/**
 * O'qituvchi har qanday bahoni bir bosishda o'zgartira oladi (9.5-bo'lim).
 * Shuning uchun ro'yxat emas, 1–4 tugmalari: bitta bosish = bitta o'zgarish.
 * O'zgartirish eslab qolinadi va avtomatik qayta hisoblash unga tegmaydi.
 */
export function AssessmentEditor({
  assessmentId,
  initial,
  ai,
  initialNote,
  edited,
  reviewed,
  flagged,
}: {
  assessmentId: string;
  initial: Levels;
  /** AI qo'ygan asl baho — o'zgarmaydi. Eski yozuvlarda bo'lmasligi mumkin. */
  ai: Partial<Levels> | null;
  initialNote: string | null;
  edited: boolean;
  /** O'qituvchi ko'rib chiqqanmi (tasdiqlagan yoki o'zgartirgan) */
  reviewed: boolean;
  flagged: boolean;
}) {
  const router = useRouter();
  const [levels, setLevels] = useState<Levels>(initial);
  const [note, setNote] = useState(initialNote ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const aiLevel = (criterion: (typeof CRITERIA)[number]) => ai?.[criterion];

  async function save(
    next: Partial<Levels & { teacherNote: string; safetyResolved: boolean; confirm: boolean }>,
  ) {
    setState("saving");
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="text-sm font-bold text-[var(--ink-soft)]">Bahoni o&apos;zgartirish</p>
        <p
          role="status"
          className={`text-sm ${
            state === "error" ? "font-bold text-[var(--warn)]" : "text-[var(--ink-soft)]"
          }`}
        >
          {state === "saving"
            ? "Saqlanyapti…"
            : state === "saved"
              ? "Saqlandi"
              : state === "error"
                ? "Saqlanmadi — qayta urinib ko'ring"
                : edited
                  ? "Siz tahrirlagansiz"
                  : reviewed
                    ? "Siz tasdiqlagansiz"
                    : "AI bahosi — hali ko'rib chiqilmagan"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map((criterion) => (
          <div key={criterion}>
            <p
              className="mb-1.5 text-sm font-bold text-[var(--ink-soft)]"
              title={CRITERION_HINTS[criterion]}
            >
              {CRITERION_LABELS[criterion]}
            </p>
            <div
              role="radiogroup"
              aria-label={CRITERION_LABELS[criterion]}
              className="flex gap-1.5"
            >
              {/* AI tanlovi tugma ostidagi nuqta bilan belgilanadi */}
              {[1, 2, 3, 4].map((level) => {
                const on = levels[criterion] === level;
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={`${LEVEL_LABELS[level]} — ${LEVEL_MEANINGS[level]}`}
                    onClick={() => {
                      if (on) return;
                      setLevels({ ...levels, [criterion]: level });
                      void save({ [criterion]: level } as Partial<Levels>);
                    }}
                    className={`h-9 flex-1 rounded-lg text-sm font-extrabold transition ${
                      on
                        ? ""
                        : "border border-[var(--line-strong)] text-[var(--ink-soft)] hover:border-[var(--leaf)] hover:text-[var(--ink)]"
                    }`}
                    style={
                      on
                        ? {
                            background: `var(--level-${level}-bg)`,
                            color: `var(--level-${level}-ink)`,
                          }
                        : undefined
                    }
                  >
                    {level}
                  </button>
                );
              })}
            </div>
            {aiLevel(criterion) !== undefined && aiLevel(criterion) !== levels[criterion] && (
              <p className="mt-1 text-xs text-[var(--ink-soft)]">
                AI bahosi: <strong>{aiLevel(criterion)}</strong> — siz o&apos;zgartirdingiz
              </p>
            )}
          </div>
        ))}
      </div>

      <div>
        <label
          htmlFor={`izoh-${assessmentId}`}
          className="mb-1.5 block text-sm font-bold text-[var(--ink-soft)]"
        >
          Izoh (ota-onaga ko&apos;rsatish uchun)
        </label>
        <textarea
          id={`izoh-${assessmentId}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => note !== (initialNote ?? "") && save({ teacherNote: note })}
          rows={2}
          placeholder="Masalan: g'oyalari ko'p, lekin tafsilot qo'shishga undash kerak"
          className="field w-full p-3 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {!reviewed && !flagged && (
          <button
            type="button"
            className="btn btn-quiet px-4 py-2 text-sm"
            onClick={() => save({ confirm: true })}
          >
            Baho to&apos;g&apos;ri — tasdiqlayman
          </button>
        )}
        {flagged && (
          <button
            type="button"
            className="btn btn-quiet px-4 py-2 text-sm"
            onClick={() => save({ safetyResolved: true })}
          >
            Ko&apos;rib chiqildi — belgini olib tashlash
          </button>
        )}
      </div>
    </div>
  );
}
