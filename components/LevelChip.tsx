import { LEVEL_LABELS, LEVEL_MEANINGS } from "@/lib/torrance";

/** Daraja rangi: past — jazo emas, e'tibor signali. */
const LEVEL_STYLES: Record<number, string> = {
  4: "bg-[#4c6b39] text-white",
  3: "bg-[#a8c48a] text-[#243018]",
  2: "bg-[#f0dcae] text-[#5b4a20]",
  1: "bg-[#e9c3c3] text-[#6b2b2b]",
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
