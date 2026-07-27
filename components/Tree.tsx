"use client";

import { useEffect, useRef } from "react";
import { CATEGORY_COLORS, CATEGORY_LABELS, type IdeaCategory } from "@/lib/torrance";
import type { TreeState } from "@/lib/tree";

/**
 * Daraxt — mukofot animatsiyasi emas, baholash natijasining ifodasi (3.2-bo'lim).
 *
 *   Shox        → Ravonlik         har bir tugallangan g'oya
 *   Shox rangi  → Moslashuvchanlik  g'oyaning toifasi
 *   Gul         → Originallik       sinfda kam uchragan g'oya
 *   Barg        → Batafsillik       har bir tafsilot birligi
 *
 * Daraxt hech qachon qurimaydi, yaproq to'kmaydi, o'lmaydi. Kam ishlagan bola
 * kichikroq daraxtni ko'radi — jazo emas, taklif.
 *
 * Nega SVG, nega WebGL emas: har bir element aniq mezonga bog'langan va uni
 * piksel darajasida boshqarish kerak; maktab planshetida GPU va batareya
 * cheklangan; offline rejim majburiy. 3D bu yerda ma'no qo'shmaydi.
 */

const W = 440;
const H = 500;
const CX = W / 2;
const GROUND = 452;

/**
 * Determinantik "tasodifiylik": bir xil daraxt har safar bir xil ko'rinadi.
 * Natija yaxlitlanadi — Math.sin serverda va brauzerda oxirgi bitda farq qilishi
 * mumkin, yaxlitlamasak SSR va gidratsiya mos kelmaydi.
 */
function round(value: number, digits = 3) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
function noise(seed: number) {
  const v = Math.sin(seed * 12.9898) * 43758.5453;
  return round(v - Math.floor(v), 6);
}
function jitter(seed: number, amp: number) {
  return (noise(seed) - 0.5) * 2 * amp;
}

/**
 * Ingichkalashuvchi shox: kvadrat egri chiziqni namunalab, normal bo'yicha
 * kengligi kamayadigan yopiq shakl quriladi. Oddiy stroke bunday tabiiy
 * torayishni bermaydi.
 */
function taperedCurve(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  w0: number,
  w1: number,
  samples = 16,
) {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const px = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const py = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    const dx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * mt * (cy - y0) + 2 * t * (y1 - cy);
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (w0 + (w1 - w0) * t) / 2;
    left.push(`${(px + nx * w).toFixed(2)},${(py + ny * w).toFixed(2)}`);
    right.push(`${(px - nx * w).toFixed(2)},${(py - ny * w).toFixed(2)}`);
  }
  return `M ${left.join(" L ")} L ${right.reverse().join(" L ")} Z`;
}

type Segment = {
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  /** Daraja: 0 — shox, 1 — novda. Qalinlik shundan */
  depth: number;
  angle: number;
};

type Placed = {
  id: string;
  category: IdeaCategory;
  flower: boolean;
  leaves: number;
  main: Segment;
  twigs: Segment[];
  side: number;
};

function segment(
  x0: number,
  y0: number,
  angleRad: number,
  length: number,
  bend: number,
  depth: number,
): Segment {
  const x1 = x0 + Math.cos(angleRad) * length;
  const y1 = y0 + Math.sin(angleRad) * length;
  // Boshqaruv nuqtasi yuqoriroq — shox tabiiy egiladi, chiziq bo'lib qolmaydi
  const cx = x0 + Math.cos(angleRad) * length * 0.5;
  const cy = y0 + Math.sin(angleRad) * length * 0.5 + bend;
  return {
    x0: round(x0),
    y0: round(y0),
    cx: round(cx),
    cy: round(cy),
    x1: round(x1),
    y1: round(y1),
    depth,
    angle: round((angleRad * 180) / Math.PI, 2),
  };
}

/**
 * Shoxlar tanadan yuqoriga qarab chiqadi va har biri ikkita novdaga ayriladi —
 * aynan shu ayrilish siluetni daraxtga o'xshatadi. Pastdagilar uzun, tepadagilar
 * kalta: umumiy shakl gumbaz bo'ladi.
 */
function layout(tree: TreeState) {
  const n = tree.branches.length;
  const trunkH = Math.min(300, 132 + n * 10);
  const trunkTop = GROUND - trunkH;

  const placed: Placed[] = tree.branches.map((branch, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const t = n === 1 ? 0.5 : 0.28 + (i / Math.max(1, n - 1)) * 0.66;
    const y0 = GROUND - 30 - t * (trunkH - 46);
    const x0 = CX + side * (4 + (1 - t) * 4);

    // Tepaga chiqqan sari shox tikroq va kaltaroq bo'ladi. Tasodifiy qo'shimcha
    // burchak shoxlar bir-biriga parallel bo'lib qolishining oldini oladi.
    const fromHorizon = 0.34 + t * 0.55 + noise(i * 3 + 1) * 0.46; // radian
    const angleRad = side === -1 ? Math.PI + fromHorizon : -fromHorizon;
    const len = (92 - t * 34) * (0.85 + noise(i * 5 + 2) * 0.32);
    const main = segment(x0, y0, angleRad, len, 7 + noise(i + 9) * 6, 0);

    const twigs = [-1, 1].map((k, ti) => {
      const spread = 0.36 + noise(i * 7 + ti) * 0.22;
      const twigLen = len * (0.36 + noise(i * 11 + ti) * 0.2);
      return segment(
        main.x1,
        main.y1,
        angleRad + k * spread * (side === -1 ? -1 : 1),
        twigLen,
        4,
        1,
      );
    });

    return {
      id: branch.id,
      category: branch.category,
      flower: branch.flower,
      leaves: branch.leaves,
      main,
      twigs,
      side,
    };
  });

  return { trunkTop, trunkH, placed };
}

/** Egri chiziq bo'ylab nuqta (barglarni joylash uchun) */
function pointOn(s: Segment, t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * s.x0 + 2 * mt * t * s.cx + t * t * s.x1,
    y: mt * mt * s.y0 + 2 * mt * t * s.cy + t * t * s.y1,
  };
}

/** Barg — tomirli tomchi shakl, shox yo'nalishiga burilib qo'yiladi. */
function Leaf({ x, y, rotate, color, scale }: { x: number; y: number; rotate: number; color: string; scale: number }) {
  return (
    <g transform={`translate(${round(x)} ${round(y)}) rotate(${round(rotate, 2)}) scale(${round(scale)})`}>
      <path
        d="M0 0 C 5.5 -3.5 9 -10.5 0 -18 C -9 -10.5 -5.5 -3.5 0 0 Z"
        fill={color}
        opacity={0.92}
      />
      <path d="M0 -1 L 0 -15" stroke="var(--bg)" strokeWidth={0.9} opacity={0.35} fill="none" />
    </g>
  );
}

function Flower({ x, y, seed }: { x: number; y: number; seed: number }) {
  const spin = round(jitter(seed, 26), 2);
  return (
    <g transform={`translate(${x} ${y}) rotate(${spin})`}>
      <circle r={16} fill="var(--bloom)" opacity={0.16} />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-6.5} rx={4.4} ry={7.2} fill="var(--bloom)" transform={`rotate(${a})`} />
      ))}
      <circle r={3.2} fill="var(--bloom-heart)" />
    </g>
  );
}

export function Tree({
  tree,
  className = "",
  showScene = true,
}: {
  tree: TreeState;
  className?: string;
  /** Sahna (osmon, tepalik, o't) bilanmi yoki faqat daraxt */
  showScene?: boolean;
}) {
  const { trunkTop, placed } = layout(tree);
  // Faqat YANGI shox o'sadi. Eskilarini har renderda qayta o'stirish —
  // bolaning e'tiborini yangi g'oyasidan chalg'itadi.
  const seen = useRef<Set<string> | null>(null);
  const firstRender = seen.current === null;
  const isNew = (id: string) => firstRender || !seen.current!.has(id);
  const newIndex = new Map<string, number>();
  let counter = 0;
  for (const b of placed) if (isNew(b.id)) newIndex.set(b.id, counter++);

  useEffect(() => {
    seen.current = new Set(placed.map((b) => b.id));
  });

  const empty = placed.length === 0;
  // Kichik daraxt kadrda yo'qolib ketmasligi uchun ko'rish maydoni daraxt
  // bo'yiga qarab qisqaradi: bir shoxli nihol ham ekranni to'ldiradi.
  const viewTop = Math.max(0, Math.round(trunkTop - 128));

  return (
    <svg
      viewBox={`0 ${viewTop} ${W} ${H - viewTop}`}
      preserveAspectRatio="xMidYMax meet"
      className={className}
      role="img"
      aria-label={
        empty
          ? "Sening daraxting hali kichkina — birinchi g'oyadan keyin shox chiqadi"
          : `Sening daraxting: ${tree.totalIdeas} ta shox, ${tree.totalFlowers} ta gul, ${tree.totalLeaves} ta barg`
      }
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sky-top)" />
          <stop offset="100%" stopColor="var(--sky-bottom)" />
        </linearGradient>
        <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--bark)" />
          <stop offset="55%" stopColor="var(--bark-light)" />
          <stop offset="100%" stopColor="var(--bark)" />
        </linearGradient>
        <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--sun)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--sun)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Osmon va yer viewBox'dan kengroq chiziladi — SVG element to'liq to'ladi,
          nisbat saqlanganda yon tomonlarda bo'sh joy qolmaydi. */}
      {showScene && (
        <g>
          <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#sky)" />
          <circle cx={352} cy={viewTop + 66} r={64} fill="url(#halo)" />
          <circle cx={352} cy={viewTop + 66} r={21} fill="var(--sun)" opacity={0.85} />
          <path
            d={`M ${-W} ${GROUND + 4} Q ${-W / 2} ${GROUND - 46} 60 ${GROUND - 6} Q 260 ${GROUND - 52} ${W * 2} ${GROUND + 2} L ${W * 2} ${H * 2} L ${-W} ${H * 2} Z`}
            fill="var(--bg-far)"
            opacity={0.55}
          />
          <path
            d={`M ${-W} ${GROUND + 12} Q 150 ${GROUND - 22} ${W * 2} ${GROUND + 14} L ${W * 2} ${H * 2} L ${-W} ${H * 2} Z`}
            fill="var(--soil)"
            opacity={0.75}
          />
          {Array.from({ length: 32 }).map((_, i) => {
            const gx = round(-260 + i * 32 + jitter(i + 30, 11));
            const gh = round(10 + noise(i + 44) * 13);
            return (
              <path
                key={i}
                d={`M ${gx} ${GROUND + 12} Q ${gx + 3} ${round(GROUND + 12 - gh * 0.6)} ${gx + 7} ${round(GROUND + 12 - gh)}`}
                stroke="var(--leaf)"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                opacity={0.5}
              />
            );
          })}
        </g>
      )}

      {/* Tana */}
      <path
        d={taperedCurve(CX, GROUND + 6, CX + 5, (GROUND + trunkTop) / 2, CX - 1, trunkTop, 17, 6, 20)}
        fill="url(#trunk)"
      />
      {/* Po'stloq izlari — tekis jigarrang shakl karton bo'lib ko'rinmasin */}
      {[0.22, 0.48, 0.72].map((t, i) => (
        <path
          key={t}
          d={`M ${CX - 3 + i * 2} ${round(GROUND - t * (GROUND - trunkTop) + 6)} q 2 ${round(-16 - noise(i + 5) * 12)} ${round(1 + noise(i + 2) * 2)} ${round(-30 - noise(i + 3) * 16)}`}
          stroke="var(--bark)"
          strokeWidth={1.4}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
      ))}
      {/* Ildiz izlari */}
      <path
        d={`M ${CX - 14} ${GROUND + 2} Q ${CX - 30} ${GROUND + 6} ${CX - 42} ${GROUND + 12}`}
        stroke="var(--bark)"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      <path
        d={`M ${CX + 14} ${GROUND + 2} Q ${CX + 32} ${GROUND + 6} ${CX + 44} ${GROUND + 11}`}
        stroke="var(--bark)"
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />

      <g className="sway" style={{ transformBox: "view-box", transformOrigin: `${CX}px ${GROUND}px` }}>
        {placed.map((b, i) => {
          const color = CATEGORY_COLORS[b.category] ?? "var(--leaf)";
          const fresh = isNew(b.id);
          const delay = (newIndex.get(b.id) ?? 0) * 140;
          // Barglar novdalarga taqsimlanadi — barg qancha ko'p, uch shuncha quyuq
          const leafCount = Math.min(b.leaves, 8);
          const spots: { seg: Segment; t: number }[] = [];
          for (let li = 0; li < leafCount; li++) {
            const seg = li % 3 === 2 ? b.main : b.twigs[li % 2];
            const t = li % 3 === 2 ? 0.62 + noise(i * 13 + li) * 0.3 : 0.42 + noise(i * 17 + li) * 0.5;
            spots.push({ seg, t });
          }
          // Novdaning uchida ham doim bittadan barg — silueti yalang'och qolmasin
          const tipLeaves = b.twigs.map((seg) => ({ seg, t: 0.98 }));
          const tip = b.twigs[b.flower ? 0 : 1];

          return (
            <g
              key={b.id}
              className={fresh ? "sprout" : undefined}
              style={{
                transformBox: "view-box",
                transformOrigin: `${b.main.x0}px ${b.main.y0}px`,
                animationDelay: fresh ? `${delay}ms` : undefined,
              }}
            >
              <path
                d={taperedCurve(b.main.x0, b.main.y0, b.main.cx, b.main.cy, b.main.x1, b.main.y1, 9, 3.4)}
                fill={color}
              />
              {b.twigs.map((twig, ti) => (
                <path
                  key={ti}
                  d={taperedCurve(twig.x0, twig.y0, twig.cx, twig.cy, twig.x1, twig.y1, 3.4, 1.4)}
                  fill={color}
                />
              ))}
              {[...spots, ...tipLeaves].map((spot, li) => {
                const p = pointOn(spot.seg, spot.t);
                const flip = li % 2 === 0 ? 1 : -1;
                return (
                  <Leaf
                    key={li}
                    x={p.x}
                    y={p.y}
                    rotate={spot.seg.angle + 90 + flip * 34 + jitter(i * 9 + li, 16)}
                    color={color}
                    scale={0.74 + noise(i * 7 + li) * 0.32}
                  />
                );
              })}
              {b.flower && (
                <g
                  className={fresh ? "bloom-open" : undefined}
                  style={{
                    transformBox: "view-box",
                    transformOrigin: `${tip.x1}px ${tip.y1}px`,
                    animationDelay: fresh ? `${delay + 520}ms` : undefined,
                  }}
                >
                  <Flower x={tip.x1} y={tip.y1} seed={i + 3} />
                </g>
              )}
            </g>
          );
        })}
      </g>

      {empty && (
        <g className="pulse-soft">
          <Leaf x={CX - 7} y={trunkTop + 4} rotate={-58} color="var(--leaf)" scale={1.1} />
          <Leaf x={CX + 7} y={trunkTop + 4} rotate={58} color="var(--leaf)" scale={1.1} />
        </g>
      )}

      {/* Oqshom bog'ida yorug' zarralar — faqat gul chiqqanda */}
      {showScene &&
        tree.totalFlowers > 0 &&
        Array.from({ length: 6 }).map((_, i) => (
          <circle
            key={i}
            className="drift"
            cx={round(70 + i * 58 + jitter(i + 60, 16))}
            cy={round(GROUND - 40 - noise(i + 70) * 150)}
            r={2.4}
            fill="var(--bloom-heart)"
            style={
              {
                animationDelay: `${i * 900}ms`,
                "--dx": `${round(jitter(i + 80, 22))}px`,
              } as React.CSSProperties
            }
          />
        ))}
    </svg>
  );
}

export function TreeLegend({ categories }: { categories: IdeaCategory[] }) {
  if (!categories.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <li
          key={category}
          className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-sunk)] px-3 py-1 text-sm"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: CATEGORY_COLORS[category] }}
          />
          {CATEGORY_LABELS[category]}
        </li>
      ))}
    </ul>
  );
}
