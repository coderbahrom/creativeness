import Link from "next/link";

/** Panelning chuqurligi ko'rinib tursin: Sinflar → Sinf → O'quvchi → Ertak */
export function Breadcrumb({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav aria-label="Yo'l">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link href={item.href} className="text-[var(--ink-soft)] hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={last ? "font-bold" : "text-[var(--ink-soft)]"} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden="true" className="text-[var(--line-strong)]">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
