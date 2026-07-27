"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Rol almashtirish. Tizimda haqiqiy autentifikatsiya yo'q (MVP), shuning uchun
 * "chiqish" emas, rejim almashtirish: bir bosishda o'quvchi ↔ o'qituvchi.
 * Dars ichida bu panel ko'rsatilmaydi — bola diqqati bo'linmasligi kerak.
 */

const ROLES = [
  { href: "/dars", label: "O'quvchi", match: "/dars" },
  { href: "/oqituvchi", label: "O'qituvchi", match: "/oqituvchi" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur"
      style={{ zIndex: "var(--z-header)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path d="M12 22V11" stroke="var(--bark)" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M12 13 L5 8" stroke="var(--leaf)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M12 16 L19 11" stroke="var(--leaf-deep)" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="5" cy="8" r="2.6" fill="var(--leaf)" />
            <circle cx="19" cy="11" r="2.6" fill="var(--bloom)" />
          </svg>
          Ertak Bog&apos;i
        </Link>

        <nav aria-label="Rejim" className="ml-auto flex items-center gap-1 rounded-full bg-[var(--surface-sunk)] p-1">
          {ROLES.map((role) => {
            const active = pathname.startsWith(role.match);
            return (
              <Link
                key={role.href}
                href={role.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  active
                    ? "bg-[var(--btn-bg)] text-[var(--btn-ink)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {role.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
