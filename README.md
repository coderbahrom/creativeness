# Ertak Bog'i — MVP

Boshlang'ich sinflar uchun kreativ o'qish platformasi. Bola ertakni o'qiydi, uni o'zicha davom
ettiradi; har bir g'oya uning daraxtini o'stiradi. Ortda AI javobni **Torrance 4 mezoni** bo'yicha
tahlil qiladi va o'qituvchiga daraja beradi.

Bu — konsepsiya hujjatining 14.1-bo'limidagi MVP hajmi: 3 ertak, kreativ topshiriq turlari, ovozli
kiritish + tasdiqlash, daraxt animatsiyasi, AI tahlili va o'qituvchi uchun sinf xaritasi.

## Ishga tushirish

```bash
npm install
cp .env.example .env       # ANTHROPIC_API_KEY ni qo'ying
npx prisma migrate dev     # bazani yaratadi
npm run db:seed            # 3 ertak + 2 sinf + o'quvchilar
npm run dev
```

Ochiladi: `http://localhost:3000` — o'quvchi uchun `/dars`, o'qituvchi uchun `/oqituvchi`.

Sinov ma'lumoti (bir sinf bir topshiriqqa javob beradi, kamyoblik matematikasini ko'rish uchun):

```bash
npm run simulate -- --reset
```

## Baholash qanday ishlaydi

| Mezon | O'lchov | Daraja qanday chiqadi |
|---|---|---|
| **Ravonlik** | Tugallangan, mavzuga aloqador g'oyalar soni | Sinf normasi bilan solishtiriladi (`lib/torrance.ts` → `CALIBRATION`) |
| **Moslashuvchanlik** | G'oyalar tegishli bo'lgan noyob toifalar soni | Xuddi shunday, o'z normasi bilan |
| **Originallik** | `1 − (shu g'oyani aytgan bolalar ulushi)` | Sinf ichidagi statistik kamyoblik, AI hukmi emas |
| **Batafsillik** | Tafsilot birliklari (sifatlash, sabab, his, dialog…) | Sinf normasi bilan solishtiriladi |

Muhim qarorlar:

- **Originallikni AI hal qilmaydi.** AI faqat g'oyaga `canonical_key` beradi; kamyoblik shu kalitni
  necha bola ishlatganidan kelib chiqadi. Bola AIni "aldab" ball ololmaydi.
- **Sinfda 15 tadan kam javob bo'lsa** taqqoslash bazasi avtomatik platforma darajasiga ko'chadi
  (`MIN_RESPONSES_FOR_CLASS_RARITY`).
- **Yangi javob kelganda** shu topshiriq bo'yicha barcha originallik baholari qayta hisoblanadi —
  o'qituvchi qo'lda o'zgartirganlaridan tashqari.
- **Aniq raqam emas, daraja** (1–4). AI o'zbekcha bolalar nutqini 100% aniq tahlil qila olmaydi;
  daraja xatoga chidamli.
- **Chegaralar boshlang'ich taxmin.** Pilotdan keyin real taqsimot asosida qayta kalibrlanadi
  (hujjatning 4.2-bo'limi).

## AI ning roli va chegaralari

`lib/analyze.ts` — bitta chaqiruv, `output_config.format` orqali qat'iy JSON sxema bilan.

AI **faqat**: g'oyalarga ajratadi, toifalaydi, tafsilot sanaydi, `canonical_key` chiqaradi, eng zaif
mezonni aniqlaydi va bitta **ochuvchi savol** beradi.

AI **hech qachon**: ertakni davom ettirmaydi, namuna javob bermaydi, variant taklif qilmaydi, ball
aytmaydi, "noto'g'ri" demaydi, bolalarni taqqoslamaydi. Bu — mahsulotning eng katta ekzistensial
xavfiga qarshi qoida (7.2-bo'lim): AI namuna bersa, bola uni nusxa ko'chiradi.

Bir sessiyada maksimum **3 ta savol** (7.3-bo'lim).

**Xavfsizlik filtri** (7.4-bo'lim): tashvishli mazmun aniqlansa — javob ballanmaydi, AI savol
bermaydi, o'qituvchi panelida alohida belgilanadi. Tizim hech qanday avtomatik xulosa chiqarmaydi.

**Kalit yo'q bo'lsa** zaxira rejim ishlaydi: gaplar bo'yicha taxminiy ajratish. Bunday baholar
o'qituvchi panelida "AI tahlilisiz" deb belgilanadi. Zaxira rejimda `canonical_key` semantik emas —
so'zma-so'z, shuning uchun originallik ko'rsatkichi ishonchsiz bo'ladi.

## Ma'lumotlar va maxfiylik

- To'liq familiya saqlanmaydi — ism + familiyaning birinchi harfi (12-bo'lim).
- Ovoz yozuvi saqlanmaydi: brauzerda matnga aylanadi, serverga faqat matn boradi.
- Ovozdan chiqqan matn har doim tasdiqlash maydoniga tushadi — bola/o'qituvchi tuzatishi mumkin.
- Bolaga ball ko'rsatilmaydi, reyting yo'q, daraxt hech qachon qurimaydi.

## Tuzilma

```
app/
  dars/                 o'quvchi oqimi (6 bosqich)
  oqituvchi/            sinf xaritasi, o'quvchi profili, baho tahriri
  api/                  sessions, responses, assessments
lib/
  torrance.ts           mezonlar, kalibrlash, daraja formulalari
  analyze.ts            Claude chaqiruvi + zaxira tahlil
  scoring.ts            baholash va sinf ichidagi kamyoblik
  tree.ts               daraxt holati (shox/gul/barg)
components/             LessonFlow, Tree, AnswerInput, AssessmentEditor
prisma/                 sxema, migratsiya, ertaklar (seed)
```

## MVP dan tashqarida

Sinf bog'i (jamoaviy ko'rinish), hisobotlar (PDF), ota-ona kirishi, offline rejim, rasm orqali
kiritish, dars vaqtidagi jonli o'qituvchi ekrani, mobil ilova, to'lov tizimi.

## Keyingi qadam

Hujjatning 17-bo'limi: kodni kengaytirishdan oldin **STT sinovi** (10 bolaning ovozi) va **qo'lda
prototip** (qog'ozda daraxt, o'qituvchi qo'lda ball qo'yadi) — baholash modeli qog'ozda ishlamasa,
ekranda ham ishlamaydi.
