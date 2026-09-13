"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Dars ekrani (9.1-bo'lim): kim ishlayapti, kim qotib qolgan.
 * Har 8 soniyada yangilanadi — dars davomida ochiq turadi.
 */

type Row = {
  id: string;
  name: string;
  started: boolean;
  stage: string | null;
  storyTitle: string | null;
  finished: boolean;
  responseCount: number;
  flagged: boolean;
  idleMinutes: number | null;
};

const STAGE_LABELS: Record<string, string> = {
  kirish: "Kirish",
  oqish: "O'qish",
  tushunish: "Tushunish",
  yaratish: "Yaratish",
  bog: "Bog'",
  yakun: "Yakun",
};

/** Qotib qolgan deb hisoblanadigan jimlik (daqiqa) */
const STUCK_MINUTES = 4;

type Status = "tugatdi" | "ishlayapti" | "qotib" | "boshlamagan";

function statusOf(row: Row): Status {
  if (!row.started) return "boshlamagan";
  if (row.finished) return "tugatdi";
  if (row.idleMinutes !== null && row.idleMinutes >= STUCK_MINUTES) return "qotib";
  return "ishlayapti";
}

const STATUS_STYLE: Record<Status, { label: string; bg: string; ink: string }> = {
  tugatdi: { label: "Tugatdi", bg: "var(--level-4-bg)", ink: "var(--level-4-ink)" },
  ishlayapti: { label: "Ishlayapti", bg: "var(--level-3-bg)", ink: "var(--level-3-ink)" },
  qotib: { label: "Qotib qolgan", bg: "var(--level-2-bg)", ink: "var(--level-2-ink)" },
  boshlamagan: { label: "Boshlamagan", bg: "var(--surface-sunk)", ink: "var(--ink-soft)" },
};

export function LiveLesson({ classroomId }: { classroomId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [at, setAt] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await fetch(`/api/dars-holat?sinf=${classroomId}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { rows: Row[]; at: string };
        if (!alive) return;
        setRows(data.rows);
        setAt(data.at);
        setError(null);
      } catch {
        if (alive) setError("Aloqa uzildi — qayta urinilyapti");
      }
    }

    void load();
    const timer = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [classroomId]);

  if (!rows) {
    return (
      <p className="card p-6 text-[var(--ink-soft)]">
        {error ?? "Holat yuklanyapti…"}
      </p>
    );
  }

  const counts = rows.reduce(
    (acc, row) => {
      acc[statusOf(row)] += 1;
      return acc;
    },
    { tugatdi: 0, ishlayapti: 0, qotib: 0, boshlamagan: 0 } as Record<Status, number>,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {(["ishlayapti", "qotib", "tugatdi", "boshlamagan"] as Status[]).map((status) => (
          <span
            key={status}
            className="rounded-full px-3 py-1.5 text-sm font-bold"
            style={{ background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].ink }}
          >
            {STATUS_STYLE[status].label}: {counts[status]}
          </span>
        ))}
        <span className="ml-auto text-sm text-[var(--ink-soft)]">
          {error ??
            (at
              ? `Yangilandi ${new Date(at).toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "")}
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const status = statusOf(row);
          const style = STATUS_STYLE[status];
          return (
            <li
              key={row.id}
              className={`card p-4 ${status === "qotib" ? "border-[var(--warn)]" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-extrabold">{row.name}</p>
                  <p className="mt-0.5 truncate text-sm text-[var(--ink-soft)]">
                    {row.storyTitle ?? "Dars boshlanmagan"}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                  style={{ background: style.bg, color: style.ink }}
                >
                  {style.label}
                </span>
              </div>

              {row.started && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--ink-soft)]">
                  <span className="font-bold text-[var(--ink)]">
                    {row.stage ? (STAGE_LABELS[row.stage] ?? row.stage) : "—"}
                  </span>
                  <span>{row.responseCount} javob</span>
                  {row.idleMinutes !== null && row.idleMinutes >= 1 && (
                    <span className={status === "qotib" ? "font-bold text-[var(--warn)]" : ""}>
                      {row.idleMinutes} daq jim
                    </span>
                  )}
                </div>
              )}

              {row.flagged && (
                <p className="mt-2 text-sm font-bold text-[var(--warn)]">
                  Belgilangan javob bor
                </p>
              )}

              <Link
                href={`/oqituvchi/oquvchi/${row.id}`}
                className="mt-3 inline-block text-sm font-bold text-[var(--leaf-deep)] hover:underline"
              >
                Profilini ochish →
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-[var(--ink-soft)]">
        &quot;Qotib qolgan&quot; — {STUCK_MINUTES} daqiqadan beri yangi javob yo&apos;q. Sahifa
        har 8 soniyada o&apos;zi yangilanadi, faqat bugungi darslar ko&apos;rsatiladi.
      </p>
    </div>
  );
}
