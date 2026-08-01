import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { usingDefaultPasswords } from "@/lib/auth";
import { login } from "./actions";

/**
 * Kirish — faqat kattalar uchun (admin va o'qituvchi).
 * O'quvchiga parol yo'q: u /dars da ismini tanlaydi.
 */
export default async function KirishPage({
  searchParams,
}: {
  searchParams: Promise<{ xato?: string; rol?: string; keyin?: string }>;
}) {
  const params = await searchParams;
  const role = params.rol === "admin" ? "admin" : "oqituvchi";

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-14">
        <h1 className="text-3xl font-extrabold">Kirish</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Bu sahifa o&apos;qituvchi va admin uchun. O&apos;quvchi{" "}
          <Link href="/dars" className="font-bold text-[var(--leaf-deep)] hover:underline">
            darsga parolsiz kiradi
          </Link>
          .
        </p>

        <form action={login} className="card mt-8 space-y-5 p-6">
          <input type="hidden" name="keyin" value={params.keyin ?? ""} />

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-[var(--ink-soft)]">Kim sifatida</legend>
            <div className="flex gap-2">
              {(
                [
                  ["oqituvchi", "O'qituvchi"],
                  ["admin", "Admin"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="pill-choice cursor-pointer">
                  <input
                    type="radio"
                    name="rol"
                    value={value}
                    defaultChecked={role === value}
                    className="sr-only"
                  />
                  <span className="btn btn-quiet">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="parol" className="mb-1 block text-sm font-bold text-[var(--ink-soft)]">
              Parol
            </label>
            <input
              id="parol"
              name="parol"
              type="password"
              required
              autoFocus
              className="field w-full p-3"
            />
          </div>

          {params.xato && (
            <p role="alert" className="font-bold text-[var(--warn)]">
              Parol noto&apos;g&apos;ri. Yana urinib ko&apos;ring.
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full justify-center">
            Kirish
          </button>

          {usingDefaultPasswords() && (
            <p className="text-xs text-[var(--ink-soft)]">
              Diqqat: parollar hali sozlanmagan, vaqtinchalik qiymatlar ishlayapti (
              <code>admin2026</code> / <code>oqituvchi2026</code>). Serverga chiqarishdan oldin{" "}
              <code>.env</code> da <code>ADMIN_PAROL</code> va <code>OQITUVCHI_PAROL</code> ni
              o&apos;rnating.
            </p>
          )}
        </form>
      </main>
    </>
  );
}
