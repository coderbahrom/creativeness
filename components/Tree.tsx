"use client";

import { CATEGORY_COLORS, CATEGORY_LABELS, type IdeaCategory } from "@/lib/torrance";
import type { TreeState } from "@/lib/tree";

/**
 * Daraxt — mukofot animatsiyasi emas, baholash natijasining ifodasi.
 * Daraxt hech qachon qurimaydi, yaproq to'kmaydi, o'lmaydi (3.2-bo'lim).
 */

const WIDTH = 420;
const HEIGHT = 460;
const TRUNK_X = WIDTH / 2;
const GROUND_Y = HEIGHT - 40;

/** Determinantik "tasodifiylik" — bir xil daraxt har safar bir xil ko'rinadi. */
function jitter(seed: number, amplitude: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return (value - Math.floor(value) - 0.5) * 2 * amplitude;
}

export function Tree({ tree, className = "" }: { tree: TreeState; className?: string }) {
  const branches = tree.branches;
  const trunkTop = GROUND_Y - Math.min(230, 90 + branches.length * 12);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax meet"
      className={className}
      role="img"
      aria-label={`Sening daraxting: ${tree.totalIdeas} shox, ${tree.totalFlowers} gul, ${tree.totalLeaves} barg`}
    >
      <ellipse cx={TRUNK_X} cy={GROUND_Y + 8} rx={140} ry={18} fill="var(--leaf)" opacity={0.18} />
      <path
        d={`M ${TRUNK_X - 16} ${GROUND_Y} Q ${TRUNK_X - 8} ${(GROUND_Y + trunkTop) / 2} ${TRUNK_X - 7} ${trunkTop}
            L ${TRUNK_X + 7} ${trunkTop} Q ${TRUNK_X + 8} ${(GROUND_Y + trunkTop) / 2} ${TRUNK_X + 16} ${GROUND_Y} Z`}
        fill="var(--bark)"
      />

      {branches.map((branch, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const level = Math.floor(index / 2);
        const levels = Math.max(1, Math.ceil(branches.length / 2));
        const startY = GROUND_Y - 40 - (level / levels) * (GROUND_Y - trunkTop - 40);
        const length = 64 + jitter(index + 1, 22) + (levels - level) * 3;
        const lift = 34 + jitter(index + 7, 16);
        const endX = TRUNK_X + side * length;
        const endY = startY - lift;
        const color = CATEGORY_COLORS[branch.category] ?? "var(--leaf)";

        return (
          <g key={branch.id} className="grow-in" style={{ animationDelay: `${index * 70}ms` }}>
            <path
              d={`M ${TRUNK_X + side * 5} ${startY} Q ${TRUNK_X + side * length * 0.55} ${startY - lift * 0.4} ${endX} ${endY}`}
              stroke={color}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
            />
            {Array.from({ length: Math.min(branch.leaves, 6) }).map((_, leafIndex) => {
              const t = (leafIndex + 1) / (Math.min(branch.leaves, 6) + 1);
              const lx = TRUNK_X + side * length * t;
              const ly = startY - lift * t * 0.85 + jitter(index * 10 + leafIndex, 6);
              return (
                <ellipse
                  key={leafIndex}
                  cx={lx}
                  cy={ly - 7}
                  rx={9}
                  ry={5.5}
                  fill={color}
                  opacity={0.75}
                  transform={`rotate(${side * -25} ${lx} ${ly - 7})`}
                />
              );
            })}
            {branch.flower && (
              <g transform={`translate(${endX} ${endY})`}>
                {[0, 72, 144, 216, 288].map((angle) => (
                  <ellipse
                    key={angle}
                    cx={0}
                    cy={-7}
                    rx={4.5}
                    ry={7.5}
                    fill="var(--bloom)"
                    transform={`rotate(${angle})`}
                  />
                ))}
                <circle r={3.4} fill="#f4d06f" />
              </g>
            )}
          </g>
        );
      })}

      {branches.length === 0 && (
        <text
          x={TRUNK_X}
          y={trunkTop - 24}
          textAnchor="middle"
          fill="var(--ink-soft)"
          fontSize={15}
        >
          Birinchi g&apos;oyangdan keyin shox chiqadi
        </text>
      )}
    </svg>
  );
}

export function TreeLegend({ categories }: { categories: IdeaCategory[] }) {
  if (!categories.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--ink-soft)]">
      {categories.map((category) => (
        <li key={category} className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: CATEGORY_COLORS[category] }}
          />
          {CATEGORY_LABELS[category]}
        </li>
      ))}
    </ul>
  );
}
