import Anthropic from "@anthropic-ai/sdk";
import {
  ELABORATION_KINDS,
  IDEA_CATEGORIES,
  normalizeKey,
  type Criterion,
  type IdeaCategory,
} from "./torrance";

/**
 * Bolaning javobini Torrance mezonlariga tayyorlaydigan tahlil.
 *
 * AI FAQAT: g'oyalarga ajratadi, toifalaydi, tafsilotlarni sanaydi, kamyoblik uchun
 * kalit chiqaradi va bitta OCHUVCHI savol beradi.
 * AI HECH QACHON: ball qo'ymaydi, namuna javob bermaydi, ertakni davom ettirmaydi (7.2).
 *
 * Ball/daraja bu yerda emas — lib/scoring.ts da, sinf statistikasi bilan hisoblanadi.
 */

export type AnalyzedIdea = {
  text: string;
  category: IdeaCategory;
  canonical_key: string;
  elaboration_count: number;
  elaboration_kinds: string[];
};

export type Analysis = {
  ideas: AnalyzedIdea[];
  discarded: { text: string; reason: string }[];
  weakest_criterion: Criterion;
  question: string;
  safety: { flagged: boolean; note: string };
  rationale: string;
  model: string;
};

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ideas: {
      type: "array",
      description:
        "Mazmunan tugallangan, topshiriqqa aloqador g'oyalar. Takror va mavzudan chetdagi gaplar bu yerga kirmaydi.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string", description: "G'oyaning qisqa ifodasi (bolaning so'zlari bilan)" },
          category: {
            type: "string",
            enum: [...IDEA_CATEGORIES],
            description: "G'oyaning semantik toifasi (moslashuvchanlik uchun)",
          },
          canonical_key: {
            type: "string",
            description:
              "G'oyaning 2-4 so'zli normallashtirilgan mazmuni, kichik harflarda. Bir xil ma'noli g'oyalar bir xil kalit olishi shart. Masalan: 'bo'ri qochib ketdi', 'quyon yordam berdi'.",
          },
          elaboration_count: {
            type: "integer",
            description: "Shu g'oyaga qo'shilgan tafsilot birliklari soni",
          },
          elaboration_kinds: {
            type: "array",
            items: { type: "string", enum: [...ELABORATION_KINDS] },
            description: "Qaysi turdagi tafsilotlar qo'shilgan",
          },
        },
        required: ["text", "category", "canonical_key", "elaboration_count", "elaboration_kinds"],
      },
    },
    discarded: {
      type: "array",
      description: "Hisobga olinmagan qismlar va sababi (takror, mavzudan chet, tugallanmagan)",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          reason: { type: "string", enum: ["takror", "mavzudan_chet", "tugallanmagan"] },
        },
        required: ["text", "reason"],
      },
    },
    weakest_criterion: {
      type: "string",
      enum: ["fluency", "flexibility", "originality", "elaboration"],
      description: "Shu javobda eng zaif ko'ringan mezon — savol shu yo'nalishga qaratiladi",
    },
    question: {
      type: "string",
      description:
        "Bolaga beriladigan BITTA ochuvchi savol. Savol namuna, variant yoki davomni O'Z ICHIGA OLMASLIGI shart. Faqat savol — 12 so'zdan oshmasin.",
    },
    safety: {
      type: "object",
      additionalProperties: false,
      properties: {
        flagged: {
          type: "boolean",
          description:
            "Javobda tashvishli mazmun bormi (zo'ravonlik, uydagi muammo, o'ziga zarar). Ertakdagi odatiy voqealar (bo'ri quyonni quvdi) tashvishli emas.",
        },
        note: { type: "string", description: "O'qituvchi uchun qisqa izoh, aks holda bo'sh satr" },
      },
      required: ["flagged", "note"],
    },
    rationale: {
      type: "string",
      description: "O'qituvchi uchun 1-2 jumlalik tushuntirish: nima uchun shunday ajratildi",
    },
  },
  required: ["ideas", "discarded", "weakest_criterion", "question", "safety", "rationale"],
} as const;

const SYSTEM_PROMPT = `Sen boshlang'ich sinf o'quvchilarining o'zbek tilidagi kreativ javoblarini tahlil qiluvchi yordamchisan.

VAZIFANG: javobni alohida g'oyalarga ajratish, har birini toifaga qo'yish, tafsilotlarni sanash va bitta ochuvchi savol berish.

QAT'IY TAQIQLAR:
- Sen ertakni davom ettirmaysan, namuna javob bermaysan, variant taklif qilmaysan.
- Savolingda javobning o'zi bo'lmasin. "Balki bo'ri kechirim so'ragandir?" — NOTO'G'RI. "Bo'ri hozir nima his qilyapti deb o'ylaysan?" — TO'G'RI.
- Sen ball qo'ymaysan va bolani baholamaysan. Faqat o'lchov ma'lumotini qaytarasan.
- Sen "noto'g'ri" demaysan va boshqa bolalar bilan taqqoslamaysan.

G'OYANI SANASH QOIDALARI:
- G'oya = mazmunan tugallangan, topshiriqqa aloqador fikr.
- Takrorlangan g'oya bir marta sanaladi (ikkinchisi discarded ga tushadi).
- "Keyin u yugurdi, keyin u sakradi, keyin u chopdi" = 3 g'oya, lekin hammasi 'voqea' toifasida.
- Imlo va grammatika xatolari g'oyaning sifatiga TA'SIR QILMAYDI.
- Ovozdan matnga o'girishdagi xatolarni mazmunan tiklashga harakat qil.

TAFSILOT (elaboration) birliklari: sifatlash, sabab ("chunki"), his-tuyg'u, tasvir, dialog, oqibat, o'xshatish.
"Bo'ri ketdi" = 0 tafsilot. "Bo'ri boshini egib, sekin ketdi, chunki uyat bo'ldi" = 3 tafsilot.

CANONICAL_KEY: bir xil ma'noli g'oyalar turli bolalarda bir xil kalit olishi shart — kamyoblik shu asosda sanaladi. Qisqa, 2-4 so'z, kichik harflar, sinonimlarni bir shaklga keltir.`;

export const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL ?? "claude-opus-5";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type AnalyzeInput = {
  grade: number;
  storyTitle: string;
  storyBody: string;
  taskPrompt: string;
  taskCriterion: Criterion;
  answer: string;
  previousQuestions?: string[];
};

export async function analyzeResponse(input: AnalyzeInput): Promise<Analysis> {
  const anthropic = getClient();
  if (!anthropic) return heuristicAnalysis(input);

  // Ertak matni butun sinf uchun bir xil — uni keshlanadigan prefiksga qo'yamiz,
  // shunda 30 bolaning javobi bitta ertak konteksti ustiga o'qiladi.
  const storyContext = `Kontekst — ertak "${input.storyTitle}":\n\n${input.storyBody}`;

  const userContent = [
    `Sinf: ${input.grade}-sinf`,
    `Kreativ topshiriq: ${input.taskPrompt}`,
    `Topshiriqning asosiy mezoni: ${input.taskCriterion}`,
    input.previousQuestions?.length
      ? `Shu sessiyada allaqachon berilgan savollar (takrorlama):\n- ${input.previousQuestions.join("\n- ")}`
      : "",
    `Bolaning javobi:\n"""\n${input.answer}\n"""`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const message = await anthropic.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 4000,
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        { type: "text", text: storyContext, cache_control: { type: "ephemeral" } },
      ],
      output_config: {
        // Tahlil arzon bo'lishi kerak (11-bo'lim): oddiy sanash/toifalash uchun past effort yetarli.
        // Haiku effort parametrini qo'llamaydi — faqat qo'llaydigan modellarga yuboriladi.
        ...(ANALYSIS_MODEL.includes("haiku") ? {} : { effort: "low" as const }),
        format: { type: "json_schema", schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> },
      },
      messages: [{ role: "user", content: userContent }],
    });

    if (message.stop_reason === "refusal") return heuristicAnalysis(input);

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return heuristicAnalysis(input);

    const parsed = JSON.parse(textBlock.text) as Omit<Analysis, "model">;
    return { ...parsed, ...sanitize(parsed), model: message.model };
  } catch (error) {
    console.error("[analyze] AI tahlili muvaffaqiyatsiz, zaxira rejimga o'tildi:", error);
    return heuristicAnalysis(input);
  }
}

function sanitize(parsed: Omit<Analysis, "model">) {
  const ideas = (parsed.ideas ?? []).map((idea) => ({
    ...idea,
    canonical_key: normalizeKey(idea.canonical_key || idea.text),
    elaboration_count: Math.max(0, Math.round(idea.elaboration_count ?? 0)),
    elaboration_kinds: idea.elaboration_kinds ?? [],
    category: (IDEA_CATEGORIES as readonly string[]).includes(idea.category)
      ? idea.category
      : ("voqea" as IdeaCategory),
  }));
  // Xavfsizlik filtri ishga tushsa — ball ham, savol ham berilmaydi (7.4).
  const flagged = parsed.safety?.flagged ?? false;
  return {
    ideas: flagged ? [] : dedupe(ideas),
    question: flagged ? "" : (parsed.question ?? ""),
    discarded: parsed.discarded ?? [],
  };
}

function dedupe(ideas: AnalyzedIdea[]): AnalyzedIdea[] {
  const seen = new Set<string>();
  return ideas.filter((idea) => {
    if (seen.has(idea.canonical_key)) return false;
    seen.add(idea.canonical_key);
    return true;
  });
}

/**
 * Zaxira rejim: ANTHROPIC_API_KEY yo'q yoki so'rov muvaffaqiyatsiz bo'lganda.
 * Bu — taxminiy o'lchov; o'qituvchi panelida "AI tahlilisiz" deb belgilanadi.
 */
/**
 * Toifani kalit so'z bo'yicha taxmin qilish. Bu semantik tahlil emas — birinchi
 * mos kelgan toifa olinadi, mos kelmasa "voqea". Faqat zaxira rejim uchun:
 * o'qituvchi panelida bunday baho "AI tahlilisiz" deb belgilanadi.
 */
const CATEGORY_MARKERS: [IdeaCategory, RegExp][] = [
  [
    "his",
    /\b(qo'rq|xursand|xafa|sevin|yig'la|kul(di|ib)|uyat|achin|hayron|g'amgin|quvon|sog'in)/i,
  ],
  ["sabab", /\b(chunki|shuning uchun|sababli|negaki)/i],
  ["oqibat", /\b(natijada|oqibat|shundan keyin|oxiri|shu bois)/i],
  ["vaqt", /\b(ertalab|kechqurun|kech(a|da)?|tun(da)?|qish|yoz|bahor|kuz|birdan|so'ng)\b/i],
  [
    "makon",
    /\b(uy|kulba|o'rmon|tog'|yo'l|bog'|qishloq|daryo|osmon|dala|shahar|g'or|hovli)/i,
  ],
  [
    "obyekt",
    /\b(xat|non|choy|kosa|eshik|deraza|chiroq|tayoq|to'qmoq|qop|arqon|kalit|sovg'a)/i,
  ],
  [
    "personaj",
    /\b(bo'ri|ho'kiz|eshak|xo'roz|it\b|quyon|tulki|chol|kampir|bola|qiz|o'g'il|sichqon|ayiq|mushuk|turna|bulut)/i,
  ],
];

/** Ochuvchi savollar (7.3-bo'lim). Bular namuna javob emas — faqat savol. */
const FALLBACK_QUESTIONS: Record<Criterion, string> = {
  fluency: "Yana nima bo'lishi mumkin edi?",
  flexibility: "Bu safar boshqa tomondan o'ylab ko'rsak-chi?",
  elaboration: "Buni menga ko'rsatib ber — u yerda nima ko'rinyapti?",
  originality: "Hech kim o'ylamagan narsa nima bo'lardi?",
};

export function heuristicAnalysis(input: AnalyzeInput): Analysis {
  const sentences = input.answer
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 2);

  const detailMarkers = /\b(chunki|uchun|sekin|tez|katta|kichik|qo'rq|xursand|xafa|go'yo|kabi|singari|dedi|so'radi)/i;
  const seen = new Set<string>();
  const ideas: AnalyzedIdea[] = [];

  for (const sentence of sentences) {
    const key = normalizeKey(sentence).split(" ").slice(0, 4).join(" ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const matches = sentence.match(new RegExp(detailMarkers, "gi")) ?? [];
    const category = CATEGORY_MARKERS.find(([, re]) => re.test(sentence))?.[0] ?? "voqea";
    ideas.push({
      text: sentence,
      category,
      canonical_key: key,
      elaboration_count: matches.length,
      elaboration_kinds: matches.length ? ["sifatlash"] : [],
    });
  }

  return {
    ideas,
    discarded: [],
    weakest_criterion: input.taskCriterion,
    question: ideas.length ? FALLBACK_QUESTIONS[input.taskCriterion] : "",
    safety: { flagged: false, note: "" },
    rationale:
      "AI tahlili ishlamadi — gaplar bo'yicha taxminiy ajratish qo'llanildi. O'qituvchi tekshiruvi zarur.",
    model: "heuristic",
  };
}
