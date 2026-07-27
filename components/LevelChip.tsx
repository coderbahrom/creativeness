import { LEVEL_LABELS, LEVEL_MEANINGS } from "@/lib/torrance";

/** Daraja rangi: past — jazo emas, e'tibor signali. */
const LEVEL_STYLES: Record<number, string> = {
  4: "bg-[var(--level-4-bg)] text-[var(--level-4-ink)]",
  3: "bg-[var(--level-3-bg)] text-[var(--level-3-ink)]",
  2: "bg-[var(--level-2-bg)] text-[var(--level-2-ink)]",
  1: "bg-[var(--level-1-bg)] text-[var(--level-1-ink)]",
  0: "bg-[var(--line)] text-[var(--ink-soft)]",
};

export function LevelChip({ level, title }: { level: number; title?: string }) {
  return (
    <span
      className={`inline-flex min-w-9 items-center justify-center rounded-md px-2 py-1 text-sm font-bold ${LEVEL_STYLES[level] ?? LEVEL_STYLES[0]}`}
      title={title ?? (level ? `${LEVEL_LABELS[level]} — ${LEVEL_MEANINGS[level]}` : "Baholanmagan")}
    >
      {level || "—"}
    </span>
  );
}
