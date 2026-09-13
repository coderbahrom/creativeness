import { LEVEL_LABELS, type Criterion, CRITERION_HINTS, CRITERION_LABELS } from "@/lib/torrance";
import { TREND_LABEL, type Trend } from "@/lib/analytics";

/**
 * Bitta mezon kartasi: daraja, aniq o'rtacha, o'sish yo'nalishi va
 * vaqt bo'yicha kichik grafik. O'qituvchi bir qarashda holatni ko'rsin.
 */

const TREND_MARK: Record<Trend, string> = { up: "↑", down: "↓", flat: "→", unknown: "" };
const TREND_TONE: Record<Trend, string> = {
  up: "text-[var(--leaf-deep)]",
  down: "text-[var(--warn)]",
  flat: "text-[var(--ink-soft)]",
  unknown: "text-[var(--ink-soft)]",
};

export function CriterionCard({
  criterion,
  level,
  average,
  trend,
  series,
}: {
  criterion: Criterion;
  level: number | null;
  average: number | null;
  trend: Trend;
  /** Har bir ertak/sessiya uchun daraja (1..4), vaqt tartibida */
  series: number[];
}) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div>
        <p className="text-sm font-bold text-[var(--ink-soft)]" title={CRITERION_HINTS[criterion]}>
          {CRITERION_LABELS[criterion]}
        </p>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className="text-3xl leading-none font-extrabold"
          style={{ color: level ? `var(--level-${level}-strong)` : "var(--ink-soft)" }}
        >
          {level ?? "—"}
        </span>
        {average !== null && (
          <span className="text-sm text-[var(--ink-soft)]">o&apos;rtacha {average.toFixed(1)}</span>
        )}
      </div>

      <p className="text-sm">
        {level ? (
          <span className="font-bold">{LEVEL_LABELS[level]}</span>
        ) : (
          <span className="text-[var(--ink-soft)]">Baholanmagan</span>
        )}
        {trend !== "unknown" && (
          <span className={`ml-2 font-bold ${TREND_TONE[trend]}`}>
            {TREND_MARK[trend]} {TREND_LABEL[trend]}
          </span>
        )}
      </p>

      {series.length > 1 && <Sparkbars series={series} />}
    </div>
  );
}

/** Daraja ustunchalari: 4 pog'onali shkala, vaqt chapdan o'ngga */
function Sparkbars({ series }: { series: number[] }) {
  return (
    <div
      className="flex h-9 items-end gap-1"
      role="img"
      aria-label={`Vaqt bo'yicha darajalar: ${series.join(", ")}`}
    >
      {series.map((level, i) => (
        <span
          key={i}
          className="flex-1 rounded-t-sm"
          style={{
            height: `${(Math.max(1, Math.min(4, level)) / 4) * 100}%`,
            background: `var(--level-${Math.max(1, Math.min(4, level))}-bg)`,
          }}
        />
      ))}
    </div>
  );
}
