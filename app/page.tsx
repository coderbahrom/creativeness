import Link from "next/link";
import { ANALYSIS_MODEL, isAiEnabled } from "@/lib/analyze";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl font-extrabold">Ertak Bog&apos;i</h1>
      <p className="mt-3 text-lg text-[var(--ink-soft)]">
        Boshlang&apos;ich sinflar uchun kreativ o&apos;qish. Bola ertakni o&apos;qiydi va uni
        o&apos;zicha davom ettiradi — har bir g&apos;oya uning daraxtini o&apos;stiradi. Ortda AI
        javoblarni Torrance 4 mezoni bo&apos;yicha tahlil qiladi.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link href="/dars" className="card block p-6 transition hover:border-[var(--leaf-deep)]">
          <h2 className="text-xl font-bold">O&apos;quvchi</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Ertakni o&apos;qish, kreativ topshiriq va daraxt.
          </p>
        </Link>
        <Link
          href="/oqituvchi"
          className="card block p-6 transition hover:border-[var(--leaf-deep)]"
        >
          <h2 className="text-xl font-bold">O&apos;qituvchi</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Sinf xaritasi, 4 mezon bo&apos;yicha darajalar va tahrirlash.
          </p>
        </Link>
      </div>

      <div className="card mt-10 space-y-2 p-5 text-sm text-[var(--ink-soft)]">
        <p>
          <strong className="text-[var(--ink)]">AI tahlili:</strong>{" "}
          {isAiEnabled() ? (
            <>yoqilgan — {ANALYSIS_MODEL}</>
          ) : (
            <>
              o&apos;chirilgan. <code>ANTHROPIC_API_KEY</code> qo&apos;yilmagan, shuning uchun
              zaxira (qoidaga asoslangan) tahlil ishlaydi va baholar taxminiy bo&apos;ladi.
            </>
          )}
        </p>
        <p>
          Bolaga ball ko&apos;rsatilmaydi. Originallik AI hukmi emas — sinf ichidagi statistik
          kamyoblik asosida hisoblanadi.
        </p>
      </div>
    </main>
  );
}
