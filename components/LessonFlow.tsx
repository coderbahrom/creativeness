"use client";

import Link from "next/link";
import { useState } from "react";
import { AnswerInput } from "./AnswerInput";
import { Ertakchi } from "./Ertakchi";
import { Tree, TreeLegend } from "./Tree";
import type { TreeState } from "@/lib/tree";

/**
 * Dars oqimi (5-bo'lim): kirish → o'qish → tushunish → YARATISH → bog' → yakun.
 *
 * Ikki muhit: o'qish bosqichlari yorug' "kun" sahnasida, yaratish va daraxt
 * qorong'i "bog'" sahnasida. Bu bezak emas — bola ertakdan chiqib o'z bog'iga
 * kirganini ko'radi, va aynan o'sha yerda uning ishi yorishib turadi.
 */

export type LessonStory = {
  id: string;
  title: string;
  summary: string;
  paragraphs: string[];
  questions: { id: string; prompt: string; options: string[]; correctIndex: number }[];
  tasks: { id: string; prompt: string; typeLabel: string }[];
};

type Stage = "kirish" | "oqish" | "tushunish" | "yaratish" | "bog" | "yakun";

const STAGE_ORDER: Stage[] = ["kirish", "oqish", "tushunish", "yaratish", "bog", "yakun"];
const STAGE_LABELS: Record<Stage, string> = {
  kirish: "Kirish",
  oqish: "O'qish",
  tushunish: "Tushunish",
  yaratish: "Yaratish",
  bog: "Bog'",
  yakun: "Yakun",
};
/** Har bosqichda bolaga bitta aniq ko'rsatma — "nima qilaman?" savoli qolmasin. */
const STAGE_HINTS: Record<Stage, string> = {
  kirish: "Bugun nima qilishingni o'qib chiq.",
  oqish: "Ertakni oxirigacha o'qi. Shoshilma.",
  tushunish: "Uchta savol. Bu yerda to'g'ri javob bor.",
  yaratish: "Endi o'zing o'ylab top. To'g'ri javob yo'q.",
  bog: "Bugun daraxting qanday o'sganini ko'r.",
  yakun: "Oxirgi bitta savol — o'zing uchun.",
};
/** Yorug' sahnadan qorong'i bog'ga o'tish nuqtasi */
const GARDEN_STAGES: Stage[] = ["yaratish", "bog", "yakun"];

export function LessonFlow({
  sessionId,
  studentName,
  grade,
  story,
  initialTree,
}: {
  sessionId: string;
  studentName: string;
  grade: number;
  story: LessonStory;
  initialTree: TreeState;
}) {
  const [stage, setStage] = useState<Stage>("kirish");
  const [tree, setTree] = useState<TreeState>(initialTree);
  const [taskIndex, setTaskIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [followUpOf, setFollowUpOf] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [growth, setGrowth] = useState<string | null>(null);

  const preferVoice = grade <= 2;
  const task = story.tasks[taskIndex];
  const scene = GARDEN_STAGES.includes(stage) ? "bog" : "kun";
  const stageIndex = STAGE_ORDER.indexOf(stage);

  async function goTo(next: Stage) {
    setStage(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stage: next }),
    }).catch(() => undefined);
  }

  async function submitAnswer() {
    if (!task) return;
    setBusy(true);
    setNotice(null);
    setGrowth(null);
    const before = tree;
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          taskId: task.id,
          text: answer,
          inputMethod: preferVoice ? "ovoz" : "matn",
          followUpOf,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        responseId: string;
        question: string | null;
        flagged: boolean;
        tree: TreeState;
      };
      setTree(data.tree);
      setAnswer("");
      setFlagged(data.flagged);
      setQuestion(data.question);
      setFollowUpOf(data.question ? data.responseId : null);
      if (data.flagged) {
        setNotice("Rahmat. Buni o'qituvching bilan gaplashib olsang yaxshi bo'ladi.");
      } else {
        // Ball emas, o'sish aytiladi. Bolaga raqam ko'rsatilmaydi (4.3-bo'lim).
        const newBranches = data.tree.totalIdeas - before.totalIdeas;
        const newFlowers = data.tree.totalFlowers - before.totalFlowers;
        const newLeaves = data.tree.totalLeaves - before.totalLeaves;
        const parts: string[] = [];
        if (newBranches > 0) parts.push(`${newBranches} ta yangi shox`);
        if (newLeaves > 0) parts.push(`${newLeaves} ta barg`);
        if (newFlowers > 0) parts.push(`${newFlowers} ta gul`);
        setGrowth(parts.length ? `Daraxtingda ${parts.join(", ")} paydo bo'ldi.` : null);
      }
    } catch {
      setNotice("Javobni saqlab bo'lmadi. Yana urinib ko'r.");
    } finally {
      setBusy(false);
    }
  }

  function nextTask() {
    setQuestion(null);
    setFollowUpOf(null);
    setAnswer("");
    setNotice(null);
    setGrowth(null);
    if (taskIndex + 1 < story.tasks.length) setTaskIndex(taskIndex + 1);
    else void goTo("bog");
  }

  async function finish() {
    await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reflection, finish: true }),
    }).catch(() => undefined);
    setStage("yakun");
    setNotice("Bugungi ishing saqlandi. Daraxting seni kutib turadi.");
  }

  return (
    <div data-scene={scene} className="min-h-dvh">
      <header
        className="sticky top-0 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg)_90%,transparent)] backdrop-blur"
        style={{ zIndex: "var(--z-header)" }}
      >
        <div className="mx-auto max-w-5xl px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold">{story.title}</h1>
              <p className="text-sm text-[var(--ink-soft)]">{STAGE_HINTS[stage]}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm font-bold text-[var(--ink-soft)] sm:inline">
                {studentName}
              </span>
              <Link href="/dars" className="btn btn-quiet px-4 py-2 text-sm">
                Chiqish
              </Link>
            </div>
          </div>

          {/* Telefon: to'liq zinapoya sig'maydi — bosqich nomi va chiziq yetarli */}
          <div className="mt-3 sm:hidden">
            <div className="flex items-baseline justify-between text-sm font-bold">
              <span>{STAGE_LABELS[stage]}</span>
              <span className="text-[var(--ink-soft)]">
                {stageIndex + 1}/{STAGE_ORDER.length}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className="h-full rounded-full bg-[var(--leaf)] transition-[width] duration-500"
                style={{ width: `${((stageIndex + 1) / STAGE_ORDER.length) * 100}%` }}
              />
            </div>
          </div>

          <ol className="mt-3 hidden items-center gap-1.5 sm:flex">
            {STAGE_ORDER.map((item, index) => {
              const done = index < stageIndex;
              const current = item === stage;
              return (
                <li key={item} className="flex flex-1 items-center gap-1.5">
                  <span
                    className={`flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-bold transition-colors ${
                      current
                        ? "bg-[var(--btn-bg)] text-[var(--btn-ink)]"
                        : done
                          ? "bg-[color-mix(in_oklab,var(--leaf)_28%,transparent)] text-[var(--ink)]"
                          : "border border-[var(--line)] text-[var(--ink-soft)]"
                    }`}
                  >
                    {current || done ? STAGE_LABELS[item] : index + 1}
                  </span>
                  {index < STAGE_ORDER.length - 1 && (
                    <span
                      className={`h-0.5 flex-1 rounded-full ${
                        done ? "bg-[var(--leaf)]" : "bg-[var(--line)]"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main key={stage} className="scene-in mx-auto max-w-5xl px-5 pb-24 pt-8">
        {stage === "kirish" && (
          <section className="mx-auto max-w-2xl space-y-6">
            <p className="story-text">{story.summary}</p>
            <div className="card space-y-3 p-6">
              <p className="kid-text font-bold">
                Sen bugun bu ertakni o&apos;qiysan va uni o&apos;zingcha davom ettirasan.
              </p>
              <p className="kid-text text-[var(--ink-soft)]">
                To&apos;g&apos;ri javob yo&apos;q. Faqat sening g&apos;oyang bor — va u
                daraxtingni o&apos;stiradi.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => goTo("oqish")}>
              Boshlash
            </button>
          </section>
        )}

        {stage === "oqish" && (
          <section className="mx-auto max-w-2xl space-y-6">
            <div className="space-y-5">
              {story.paragraphs.map((paragraph, index) => (
                <p key={index} className="story-text whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => goTo("tushunish")}>
              O&apos;qib bo&apos;ldim
            </button>
          </section>
        )}

        {stage === "tushunish" && (
          <section className="mx-auto max-w-2xl space-y-4">
            {story.questions.map((q, qi) => {
              const chosen = quizAnswers[q.id];
              return (
                <div key={q.id} className="card space-y-4 p-6">
                  <p className="kid-text font-bold">
                    <span className="mr-2 text-[var(--ink-soft)]">{qi + 1}.</span>
                    {q.prompt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((option, index) => {
                      const isChosen = chosen === index;
                      const correct = index === q.correctIndex;
                      return (
                        <button
                          key={option}
                          aria-pressed={isChosen}
                          onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: index })}
                          className={`btn ${
                            isChosen && correct
                              ? "bg-[var(--leaf)] text-[var(--btn-ink)]"
                              : "btn-quiet"
                          } ${isChosen && !correct ? "border-[var(--warn)]" : ""}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {chosen !== undefined && chosen !== q.correctIndex && (
                    <p className="text-[var(--warn)]">
                      Yana bir o&apos;ylab ko&apos;r — javob matnda bor.
                    </p>
                  )}
                </div>
              );
            })}
            <button className="btn btn-primary" onClick={() => goTo("yaratish")}>
              Endi yaratamiz
            </button>
          </section>
        )}

        {stage === "yaratish" && task && (
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-bold text-[var(--ink-soft)]">
                  {task.typeLabel} · topshiriq {taskIndex + 1}/{story.tasks.length}
                </p>
                <p className="kid-text text-2xl leading-snug font-extrabold">{task.prompt}</p>
              </div>

              {question && (
                <div className="card flex items-start gap-4 border-[var(--leaf)] p-5">
                  <Ertakchi className="h-11 w-11 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[var(--leaf)]">Ertakchi so&apos;rayapti</p>
                    <p className="kid-text">{question}</p>
                  </div>
                </div>
              )}

              {notice && (
                <p role="status" className="kid-text text-[var(--warn)]">
                  {notice}
                </p>
              )}

              {/* O'sish xabari chap ustunda ham turadi: telefonda daraxt pastda
                  qoladi, bola javob berganini darhol ko'rishi kerak. */}
              {growth && (
                <p role="status" className="rise-in kid-text font-bold text-[var(--leaf)] lg:hidden">
                  {growth}
                </p>
              )}

              {!flagged && (
                <AnswerInput
                  value={answer}
                  onChange={setAnswer}
                  onSubmit={submitAnswer}
                  busy={busy}
                  preferVoice={preferVoice}
                  placeholder={
                    question ? "Savolga javobingni qo'sh..." : "O'z g'oyangni yoz yoki gapir..."
                  }
                  submitLabel={question ? "Qo'shdim" : "Tayyor"}
                />
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button className="btn btn-quiet" onClick={nextTask}>
                  {taskIndex + 1 < story.tasks.length ? "Keyingi topshiriq" : "Bog'ga o'tish"}
                </button>
                {taskIndex + 1 < story.tasks.length && (
                  <button
                    className="btn btn-quiet border-transparent"
                    onClick={() => goTo("bog")}
                  >
                    Daraxtimni ko&apos;rish
                  </button>
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="overflow-hidden rounded-[1.75rem] border border-[var(--line)] shadow-[var(--shadow-card)]">
                <Tree tree={tree} className="block h-56 w-full lg:h-72" />
              </div>
              <p
                className={`mt-3 min-h-12 text-center font-bold ${
                  growth ? "rise-in text-[var(--leaf)]" : "text-[var(--ink-soft)]"
                }`}
              >
                {growth ?? (tree.totalIdeas === 0 ? "Birinchi g'oyangdan keyin shox chiqadi." : " ")}
              </p>
            </aside>
          </section>
        )}

        {stage === "bog" && (
          <section className="mx-auto max-w-3xl space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] shadow-[var(--shadow-lift)]">
              <Tree tree={tree} className="block h-[26rem] w-full" />
            </div>

            <div className="space-y-4">
              <p className="kid-text text-2xl font-extrabold">
                {tree.totalIdeas === 0
                  ? "Daraxting hali seni kutyapti."
                  : `Bugun daraxtingda ${tree.totalIdeas} ta shox${
                      tree.totalLeaves > 0 ? `, ${tree.totalLeaves} ta barg` : ""
                    }${tree.totalFlowers > 0 ? `, ${tree.totalFlowers} ta gul` : ""} paydo bo'ldi.`}
              </p>
              {tree.totalFlowers > 0 && (
                <p className="kid-text text-[var(--ink-soft)]">
                  Gul — sinfda boshqa hech kim aytmagan g&apos;oya uchun.
                </p>
              )}
              <TreeLegend categories={tree.categories} />
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="btn btn-quiet" onClick={() => goTo("yaratish")}>
                Yana g&apos;oya qo&apos;shaman
              </button>
              <button className="btn btn-primary" onClick={() => goTo("yakun")}>
                Yakunlash
              </button>
            </div>
          </section>
        )}

        {stage === "yakun" && (
          <section className="mx-auto max-w-2xl space-y-5">
            <p className="kid-text text-2xl font-extrabold">
              Bugungi eng qiziq g&apos;oyam qaysi edi?
            </p>
            <textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              rows={3}
              className="kid-text field w-full p-4"
              placeholder="O'zing uchun yozib qo'y..."
            />
            <div className="flex flex-wrap items-center gap-3">
              <button className="btn btn-primary" onClick={finish}>
                Saqlash
              </button>
              <Link href="/dars" className="btn btn-quiet">
                Darsni yopish
              </Link>
            </div>
            {notice && (
              <p role="status" className="kid-text text-[var(--leaf)]">
                {notice}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
