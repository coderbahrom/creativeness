import { PdfUpload } from "@/components/PdfUpload";
import { TASK_TYPES, type TaskType } from "@/lib/torrance";
import { saveStory } from "./actions";

/**
 * Ertak formasi — yangi va tahrirlash uchun bitta. Oddiy HTML forma:
 * indekslangan maydonlar (q0_, t0_ ...), mijoz JS talab qilmaydi.
 */

export type StoryFormData = {
  id?: string;
  title?: string;
  summary?: string;
  body?: string;
  gradeMin?: number;
  gradeMax?: number;
  published?: boolean;
  pdfPath?: string | null;
  questions?: { prompt: string; options: string[]; correctIndex: number }[];
  /** Tahrirlanadigan (javobsiz) topshiriqlar */
  tasks?: { type: string; prompt: string }[];
  /** Javob bog'langan — o'zgartirib bo'lmaydi */
  lockedTasks?: { type: string; prompt: string; responseCount: number }[];
};

const XATOLAR: Record<string, string> = {
  maydon: "Sarlavha, qisqacha mazmun va matn to'ldirilishi shart.",
  topshiriq: "Kamida bitta kreativ topshiriq kiriting.",
  pdf: "PDF fayl 15 MB dan kichik .pdf bo'lishi kerak.",
};

export function StoryForm({ story, xato }: { story: StoryFormData; xato?: string }) {
  const questions = [0, 1, 2].map((i) => story.questions?.[i]);
  const editableCount = Math.max(3, (story.tasks?.length ?? 0) + 1);
  const taskSlots = Array.from({ length: Math.min(6, editableCount) }, (_, i) => story.tasks?.[i]);

  return (
    <form action={saveStory} className="mt-6 space-y-8">
      {story.id && <input type="hidden" name="id" value={story.id} />}

      {xato && (
        <p role="alert" className="rounded-xl border border-[var(--warn)] px-4 py-3 font-bold text-[var(--warn)]">
          {XATOLAR[xato] ?? "Saqlashda xatolik."}
        </p>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="font-extrabold">Ertak</h2>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px_110px]">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
              Sarlavha
            </label>
            <input id="title" name="title" required maxLength={80} defaultValue={story.title} className="field w-full p-2.5" />
          </div>
          <div>
            <label htmlFor="gradeMin" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
              Sinf (dan)
            </label>
            <select id="gradeMin" name="gradeMin" defaultValue={story.gradeMin ?? 1} className="field w-full p-2.5">
              {[1, 2, 3, 4].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gradeMax" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
              Sinf (gacha)
            </label>
            <select id="gradeMax" name="gradeMax" defaultValue={story.gradeMax ?? 2} className="field w-full p-2.5">
              {[1, 2, 3, 4].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="summary" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
            Qisqacha mazmun (darsning kirish ekranida ko&apos;rinadi)
          </label>
          <input id="summary" name="summary" required maxLength={200} defaultValue={story.summary} className="field w-full p-2.5" />
        </div>
        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
            Matn — paragraflar bo&apos;sh qator bilan ajratiladi
          </label>
          <textarea id="body" name="body" rows={12} defaultValue={story.body} className="field w-full p-3 font-[var(--font-literata)]" />
        </div>
        <div>
          <p className="mb-2 text-sm font-bold text-[var(--ink-soft)]">PDF asl nusxa</p>
          <PdfUpload currentPath={story.pdfPath} />
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 font-bold">
          <input type="checkbox" name="published" defaultChecked={story.published ?? true} className="h-4 w-4" />
          E&apos;lon qilingan
          <span className="font-normal text-[var(--ink-soft)]">
            — belgilanmasa, o&apos;quvchi bu ertakni ko&apos;rmaydi
          </span>
        </label>
      </section>

      <section className="card space-y-5 p-5">
        <div>
          <h2 className="font-extrabold">Tushunish savollari (3 tagacha)</h2>
          <p className="text-sm text-[var(--ink-soft)]">
            Bu yerda to&apos;g&apos;ri javob bor. Variantlar — har biri yangi qatorda.
          </p>
        </div>
        {questions.map((q, i) => (
          <div key={i} className="grid gap-3 border-t border-[var(--line)] pt-4 first:border-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px]">
            <div>
              <label htmlFor={`q${i}_prompt`} className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
                {i + 1}-savol
              </label>
              <input id={`q${i}_prompt`} name={`q${i}_prompt`} defaultValue={q?.prompt} maxLength={200} className="field w-full p-2.5" />
            </div>
            <div>
              <label htmlFor={`q${i}_options`} className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
                Variantlar
              </label>
              <textarea id={`q${i}_options`} name={`q${i}_options`} rows={3} defaultValue={q?.options.join("\n")} className="field w-full p-2.5 text-sm" />
            </div>
            <div>
              <label htmlFor={`q${i}_correct`} className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
                To&apos;g&apos;risi
              </label>
              <input
                id={`q${i}_correct`}
                name={`q${i}_correct`}
                type="number"
                min={1}
                max={6}
                defaultValue={q ? q.correctIndex + 1 : 1}
                className="field w-full p-2.5"
              />
            </div>
          </div>
        ))}
      </section>

      <section className="card space-y-5 p-5">
        <div>
          <h2 className="font-extrabold">Kreativ topshiriqlar</h2>
          <p className="text-sm text-[var(--ink-soft)]">
            To&apos;g&apos;ri javobi bo&apos;lmasin (6-bo'lim). Mezon turdan avtomatik aniqlanadi.
          </p>
        </div>

        {story.lockedTasks && story.lockedTasks.length > 0 && (
          <ul className="space-y-2">
            {story.lockedTasks.map((t, i) => (
              <li key={i} className="rounded-xl bg-[var(--surface-sunk)] px-4 py-3 text-sm">
                <span className="font-bold">{TASK_TYPES[t.type as TaskType]?.label ?? t.type}:</span>{" "}
                {t.prompt}
                <span className="ml-2 text-[var(--ink-soft)]">
                  {t.responseCount} javob bor — o&apos;zgartirilmaydi
                </span>
              </li>
            ))}
          </ul>
        )}

        {taskSlots.map((t, i) => (
          <div key={i} className="grid gap-3 border-t border-[var(--line)] pt-4 first:border-0 first:pt-0 sm:grid-cols-[200px_minmax(0,1fr)]">
            <div>
              <label htmlFor={`t${i}_type`} className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
                Turi
              </label>
              <select id={`t${i}_type`} name={`t${i}_type`} defaultValue={t?.type ?? "davom_ettirish"} className="field w-full p-2.5">
                {Object.entries(TASK_TYPES).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`t${i}_prompt`} className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
                Topshiriq matni
              </label>
              <input id={`t${i}_prompt`} name={`t${i}_prompt`} defaultValue={t?.prompt} maxLength={300} className="field w-full p-2.5" />
            </div>
          </div>
        ))}
      </section>

      <button type="submit" className="btn btn-primary">
        Saqlash
      </button>
    </form>
  );
}
