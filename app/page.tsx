import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Tree } from "@/components/Tree";
import { ANALYSIS_MODEL, isAiEnabled } from "@/lib/analyze";
import type { TreeState } from "@/lib/tree";

/** Bosh sahifadagi namuna daraxt — bolaning ekrani nimaga o'xshashini ko'rsatadi. */
const DEMO_TREE: TreeState = {
  branches: [
    { id: "d1", category: "personaj", flower: false, leaves: 2 },
    { id: "d2", category: "makon", flower: false, leaves: 1 },
    { id: "d3", category: "voqea", flower: false, leaves: 3 },
    { id: "d4", category: "his", flower: true, leaves: 2 },
    { id: "d5", category: "sabab", flower: false, leaves: 4 },
    { id: "d6", category: "oqibat", flower: false, leaves: 1 },
    { id: "d7", category: "vaqt", flower: true, leaves: 2 },
  ],
  totalIdeas: 7,
  totalLeaves: 15,
  totalFlowers: 2,
  categories: ["personaj", "makon", "voqea", "his", "sabab", "oqibat", "vaqt"],
};

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <h1 className="text-4xl font-extrabold sm:text-5xl">
              Bola ertakni o&apos;qiydi.
              <br />
              Keyin uni o&apos;zi davom ettiradi.
            </h1>
            <p className="max-w-[60ch] text-lg text-[var(--ink-soft)]">
              Har bir g&apos;oya bolaning daraxtiga shox qo&apos;shadi, har bir tafsilot barg
              beradi, sinfda hech kim aytmagan g&apos;oya esa gul ochadi. Ortda AI javoblarni
              Torrance 4 mezoni bo&apos;yicha tahlil qiladi va o&apos;qituvchiga aniq manzara
              beradi.
            </p>
            <p className="max-w-[60ch] font-bold">
              To&apos;g&apos;ri javob yo&apos;q. Faqat qanchalik ko&apos;p, qanchalik xilma-xil,
              qanchalik o&apos;ziga xos va qanchalik batafsil o&apos;ylanganligi bor.
            </p>
          </div>

          <div
            data-scene="bog"
            className="overflow-hidden rounded-[2rem] border border-[var(--line)] shadow-[var(--shadow-lift)]"
          >
            <Tree tree={DEMO_TREE} className="block h-[22rem] w-full" />
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-2">
          <Link
            href="/dars"
            className="card group block p-6 transition hover:-translate-y-0.5 hover:border-[var(--leaf)]"
          >
            <h2 className="text-xl font-extrabold">O&apos;quvchi</h2>
            <p className="mt-2 text-[var(--ink-soft)]">
              Ertakni o&apos;qish, kreativ topshiriq va o&apos;suvchi daraxt. 6 bosqichli dars.
            </p>
            <span className="mt-4 inline-block font-bold text-[var(--leaf-deep)]">
              Darsni boshlash →
            </span>
          </Link>
          <Link
            href="/oqituvchi"
            className="card group block p-6 transition hover:-translate-y-0.5 hover:border-[var(--leaf)]"
          >
            <h2 className="text-xl font-extrabold">O&apos;qituvchi</h2>
            <p className="mt-2 text-[var(--ink-soft)]">
              Sinf xaritasi, 4 mezon bo&apos;yicha darajalar, har bir bahoni tahrirlash.
            </p>
            <span className="mt-4 inline-block font-bold text-[var(--leaf-deep)]">
              Panelni ochish →
            </span>
          </Link>
        </section>

        <section className="mt-10 space-y-2 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-sunk)] p-5 text-sm text-[var(--ink-soft)]">
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
        </section>

        <footer className="mt-10 border-t border-[var(--line)] pt-5 text-sm text-[var(--ink-soft)]">
          <p>
            <strong className="text-[var(--ink)]">Naima.CreativRead</strong> — kreativ
            o&apos;qishni Torrance mezonlari bilan o&apos;lchash metodikasi. Ertak Bog&apos;i —
            shu metodikaning amaliy platformasi.
          </p>
        </footer>
      </main>
    </>
  );
}
