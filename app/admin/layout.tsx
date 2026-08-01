import Link from "next/link";
import { logout } from "@/app/kirish/actions";

/** Admin hududi: o'z navigatsiyasi bor, bola ekranidan butunlay ajratilgan. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header
        className="sticky top-0 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur"
        style={{ zIndex: "var(--z-header)" }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
          <Link href="/admin" className="font-extrabold tracking-tight">
            Ertak Bog&apos;i · Admin
          </Link>
          <nav className="flex items-center gap-1 text-sm font-bold">
            <Link
              href="/admin/sinflar"
              className="rounded-full px-3 py-1.5 text-[var(--ink-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
            >
              Sinflar
            </Link>
            <Link
              href="/admin/ertaklar"
              className="rounded-full px-3 py-1.5 text-[var(--ink-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
            >
              Ertaklar
            </Link>
            <Link
              href="/oqituvchi"
              className="rounded-full px-3 py-1.5 text-[var(--ink-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
            >
              O&apos;qituvchi paneli
            </Link>
          </nav>
          <form action={logout} className="ml-auto">
            <button type="submit" className="btn btn-quiet px-4 py-1.5 text-sm">
              Chiqish
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
    </>
  );
}
