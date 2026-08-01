import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";

export const metadata = {
  title: "Qo'llanma — Ertak Bog'i",
  description: "O'qituvchi uchun qisqa qo'llanma: darsni qanday o'tkazish va baholarni qanday o'qish",
};

/**
 * O'qituvchi qo'llanmasi. Ochiq sahifa — parol talab qilmaydi, chunki
 * unda hech qanday bola ma'lumoti yo'q, faqat ko'rsatma.
 */

function Qadam({
  raqam,
  sarlavha,
  children,
}: {
  raqam: number;
  sarlavha: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--btn-bg)] font-extrabold text-[var(--btn-ink)]"
      >
        {raqam}
      </span>
      <div className="space-y-2">
        <h3 className="text-lg font-extrabold">{sarlavha}</h3>
        <div className="space-y-2 text-[var(--ink-soft)]">{children}</div>
      </div>
    </li>
  );
}

export default function QollanmaPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Qanday ishlash kerak</h1>
        <p className="mt-3 text-lg text-[var(--ink-soft)]">
          Ertak Bog&apos;i — bola ertakni o&apos;qib, uni o&apos;zicha davom ettiradigan dars.
          Har bir g&apos;oya uning daraxtiga shox qo&apos;shadi, siz esa 4 mezon bo&apos;yicha
          aniq manzarani ko&apos;rasiz. Tayyorgarlik talab qilinmaydi.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-extrabold">Uch xil kirish</h2>
          <ul className="mt-4 space-y-3">
            <li className="card p-5">
              <p className="font-extrabold">Admin</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                Sinf va o&apos;quvchi qo&apos;shadi, ertak joylaydi. Parol bilan:{" "}
                <Link href="/kirish" className="font-bold text-[var(--leaf-deep)] hover:underline">
                  /kirish
                </Link>
              </p>
            </li>
            <li className="card p-5">
              <p className="font-extrabold">O&apos;qituvchi</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                Sinf xaritasi, darajalar, baholarni tahrirlash. Parol bilan.
              </p>
            </li>
            <li className="card p-5">
              <p className="font-extrabold">O&apos;quvchi</p>
              <p className="mt-1 text-[var(--ink-soft)]">
                Parol yo&apos;q — bola{" "}
                <Link href="/dars" className="font-bold text-[var(--leaf-deep)] hover:underline">
                  /dars
                </Link>{" "}
                sahifasida ismini tanlaydi va ishlaydi.
              </p>
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold">Birinchi kun: 4 qadam</h2>
          <ol className="mt-6 space-y-7">
            <Qadam raqam={1} sarlavha="Admin sifatida kiring">
              <p>
                <strong className="text-[var(--ink)]">Kirish</strong> sahifasida{" "}
                <strong className="text-[var(--ink)]">Admin</strong> ni tanlab, parolni kiriting.
              </p>
            </Qadam>

            <Qadam raqam={2} sarlavha="Namuna ma'lumotlarni o'chiring">
              <p>
                <strong className="text-[var(--ink)]">Sinflar</strong> bo&apos;limida tizimda
                tayyor turgan sinovchi sinflar (2-A, 4-B) bor. Ularni{" "}
                <em>Sinfni o&apos;chirish</em> bilan olib tashlang — tasdiqlash so&apos;raladi.
              </p>
              <p className="text-sm">
                Diqqat: sinf bilan birga undagi barcha o&apos;quvchi va javoblar ham
                o&apos;chadi. Bu qaytarilmaydi.
              </p>
            </Qadam>

            <Qadam raqam={3} sarlavha="O'z sinfingizni yarating">
              <p>
                Sinf nomini yozing (masalan <em>3-A sinf</em>) va darajasini tanlang.
                Daraja muhim: kutilma normasi shunga qarab hisoblanadi — 1-sinfdan 2–3 g&apos;oya,
                4-sinfdan 5–8 g&apos;oya kutiladi.
              </p>
              <p>
                So&apos;ng o&apos;quvchilarni qo&apos;shing:{" "}
                <strong className="text-[var(--ink)]">ism va familiyaning bosh harfi</strong>.
                To&apos;liq familiya saqlanmaydi.
              </p>
            </Qadam>

            <Qadam raqam={4} sarlavha="Ertakni tekshiring">
              <p>
                <strong className="text-[var(--ink)]">Ertaklar</strong> bo&apos;limida uchta
                o&apos;zbek xalq ertagi tayyor turibdi. Yangisini qo&apos;shish uchun{" "}
                <em>Yangi ertak</em>: matnni yozasiz yoki PDF yuklaysiz (matn PDFdan
                avtomatik olinadi, keyin tekshirib tuzatasiz).
              </p>
              <p>
                Har bir ertakka <strong className="text-[var(--ink)]">3 ta tushunish savoli</strong>{" "}
                (to&apos;g&apos;ri javobi bor) va{" "}
                <strong className="text-[var(--ink)]">kreativ topshiriqlar</strong>{" "}
                (to&apos;g&apos;ri javobi yo&apos;q) kiritiladi. Qoralama holatidagi ertakni bola
                ko&apos;rmaydi.
              </p>
            </Qadam>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold">Dars qanday o&apos;tadi</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Bola <strong className="text-[var(--ink)]">/dars</strong> sahifasida sinfini,
            ismini va ertakni tanlaydi — keyin oltita bosqichdan o&apos;tadi:
          </p>
          <ol className="mt-4 space-y-2">
            {[
              ["Kirish", "bugun nima qilishini o'qiydi"],
              ["O'qish", "ertak matni, kitob shriftida"],
              ["Tushunish", "3 ta tez savol — bu yerda to'g'ri javob bor"],
              ["Yaratish", "kreativ topshiriq. Darsning yuragi shu yerda"],
              ["Bog'", "daraxti qanday o'sganini ko'radi"],
              ["Yakun", "o'ziga savol: bugungi eng qiziq g'oyam qaysi edi?"],
            ].map(([nom, izoh], i) => (
              <li key={nom} className="flex gap-3 rounded-xl bg-[var(--surface-sunk)] px-4 py-3">
                <span className="font-extrabold text-[var(--ink-soft)]">{i + 1}</span>
                <span>
                  <strong>{nom}</strong> — <span className="text-[var(--ink-soft)]">{izoh}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[var(--ink-soft)]">
            &quot;Yaratish&quot; bosqichida ekran qorong&apos;i bog&apos;ga aylanadi. Bola javob
            bergan sari daraxti o&apos;sadi: har bir g&apos;oya — shox, har bir tafsilot — barg,
            sinfda hech kim aytmagan g&apos;oya — gul.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold">Baholarni o&apos;qish</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            <strong className="text-[var(--ink)]">O&apos;qituvchi paneli</strong> → sinfni tanlang.
            Har bir o&apos;quvchi uchun 4 mezon bo&apos;yicha daraja chiqadi:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-sm text-[var(--ink-soft)]">
                  <th className="py-2 pr-4 font-bold">Mezon</th>
                  <th className="py-2 font-bold">Nimani o&apos;lchaydi</th>
                </tr>
              </thead>
              <tbody className="text-[var(--ink-soft)]">
                {[
                  ["Ravonlik", "nechta ishlaydigan g'oya aytdi"],
                  ["Moslashuvchanlik", "g'oyalar necha xil toifaga tegishli"],
                  ["Originallik", "g'oya shu sinfda qanchalik kam uchraydi"],
                  ["Batafsillik", "g'oyaga qancha tafsilot qo'shdi"],
                ].map(([mezon, izoh]) => (
                  <tr key={mezon} className="border-b border-[var(--line)]">
                    <td className="py-2 pr-4 font-bold text-[var(--ink)]">{mezon}</td>
                    <td className="py-2">{izoh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[var(--ink-soft)]">
            Darajalar: <strong className="text-[var(--ink)]">4</strong> — yosh normasidan yuqori,{" "}
            <strong className="text-[var(--ink)]">3</strong> — normaga mos,{" "}
            <strong className="text-[var(--ink)]">2</strong> — biroz past,{" "}
            <strong className="text-[var(--ink)]">1</strong> — qo&apos;llab-quvvatlash kerak.
          </p>
          <p className="mt-2 text-[var(--ink-soft)]">
            Har bir bahoni <strong className="text-[var(--ink)]">o&apos;zgartirishingiz mumkin</strong> —
            o&apos;quvchi sahifasidagi &quot;O&apos;zgartirish&quot; tugmasi. Sizning tahriringiz
            yakuniy hisoblanadi va tizim uni eslab qoladi.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold">Bilib qo&apos;yish kerak</h2>
          <ul className="mt-4 space-y-3">
            {[
              [
                "Bolaga ball ko'rsatilmaydi",
                "U faqat daraxtini va rag'batlantiruvchi gapni ko'radi. Raqamlar — faqat sizda.",
              ],
              [
                "Originallik AI hukmi emas",
                "G'oya shu sinfdagi boshqa javoblarga solishtiriladi. 20 bola bir xil narsa aytsa — past, bittasi boshqacha aytsa — yuqori. Shuning uchun sinfda javoblar ko'paygan sari ko'rsatkich aniqroq bo'ladi.",
              ],
              [
                "AI bolaning o'rniga yozmaydi",
                "Ertakchi hech qachon namuna javob bermaydi — faqat ochuvchi savol beradi. Aks holda bola nusxa ko'chiradi.",
              ],
              [
                "Tashvishli javob belgilanadi",
                "Agar bola javobida zo'ravonlik yoki uydagi muammo sezilsa — tizim unga ball qo'ymaydi va sizning panelingizda alohida belgi bilan ko'rsatadi. Qaror sizda.",
              ],
              [
                "Imlo xatosi ballga ta'sir qilmaydi",
                "Kreativlik o'lchanadi, savodxonlik emas.",
              ],
            ].map(([sarlavha, izoh]) => (
              <li key={sarlavha} className="card p-5">
                <p className="font-extrabold">{sarlavha}</p>
                <p className="mt-1 text-[var(--ink-soft)]">{izoh}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-sunk)] p-5">
          <h2 className="font-extrabold">Nimadir ishlamasa</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            Ovoz kiritish Chrome va Safari brauzerlarida ishlaydi, mikrofonga ruxsat so&apos;raydi.
            O&apos;zbekcha nutqni tanish hali ishonchsiz — shuning uchun matn har doim tasdiqlash
            maydoniga tushadi, bola yoki siz tuzatib yuborasiz.
          </p>
          <p className="mt-2 text-[var(--ink-soft)]">
            Sahifa ochilmasa yoki baho g&apos;alati chiqsa — ekran rasmini oling va Bahromga
            yuboring.
          </p>
        </section>

        <p className="mt-10 text-sm text-[var(--ink-soft)]">
          <strong className="text-[var(--ink)]">Naima.CreativRead</strong> — kreativ o&apos;qishni
          Torrance mezonlari bilan o&apos;lchash metodikasi. Ertak Bog&apos;i — uning amaliy
          platformasi.
        </p>
      </main>
    </>
  );
}
