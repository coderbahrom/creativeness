"use client";

import { useState } from "react";
import { AnswerInput } from "./AnswerInput";
import { Tree, TreeLegend } from "./Tree";
import type { TreeState } from "@/lib/tree";

/**
 * Dars oqimi (5-bo'lim): kirish → o'qish → tushunish → YARATISH → bog' → yakun.
 * O'qituvchi uchun va'da: "Boshlash" tugmasini bosish kifoya, tayyorgarlik 0 daqiqa.
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

  const preferVoice = grade <= 2;
  const task = story.tasks[taskIndex];

  async function goTo(next: Stage) {
    setStage(next);
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
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-8">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-extrabold">{story.title}</h1>
          <span className="text-sm text-[var(--ink-soft)]">{studentName}</span>
        </div>
        <ol className="mt-3 flex flex-wrap gap-2 text-xs">
          {STAGE_ORDER.map((item) => (
            <li
              key={item}
              className={`rounded-full px-3 py-1 ${
                item === stage
                  ? "bg-[var(--leaf-deep)] font-bold text-white"
                  : "bg-[var(--paper-raised)] text-[var(--ink-soft)] border border-[var(--line)]"
              }`}
            >
              {STAGE_LABELS[item]}
            </li>
          ))}
        </ol>
      </header>

      {stage === "kirish" && (
        <section className="card space-y-5 p-6">
          <p className="kid-text">{story.summary}</p>
          <p className="kid-text font-bold">
            Sen bugun bu ertakni o&apos;qiysan va uni o&apos;zingcha davom ettirasan. To&apos;g&apos;ri
            javob yo&apos;q — o&apos;z g&apos;oyang bor.
          </p>
          <button className="btn btn-primary" onClick={() => goTo("oqish")}>
            Boshlash
          </button>
        </section>
      )}

      {stage === "oqish" && (
        <section className="card space-y-4 p-6">
          {story.paragraphs.map((paragraph, index) => (
            <p key={index} className="kid-text whitespace-pre-line">
              {paragraph}
            </p>
          ))}
          <button className="btn btn-primary" onClick={() => goTo("tushunish")}>
            O&apos;qib bo&apos;ldim
          </button>
        </section>
      )}

      {stage === "tushunish" && (
        <section className="space-y-4">
          <p className="text-[var(--ink-soft)]">
            Uchta tez savol. Bu yerda to&apos;g&apos;ri javob bor.
          </p>
          {story.questions.map((q) => {
            const chosen = quizAnswers[q.id];
            return (
              <div key={q.id} className="card space-y-3 p-5">
                <p className="kid-text font-bold">{q.prompt}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((option, index) => {
                    const isChosen = chosen === index;
                    const correct = index === q.correctIndex;
                    return (
                      <button
                        key={option}
                        onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: index })}
                        className={`btn ${
                          isChosen
                            ? correct
                              ? "bg-[var(--leaf)] text-white"
                              : "bg-[var(--line)] text-[var(--ink)]"
                            : "btn-quiet"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && chosen !== q.correctIndex && (
                  <p className="text-sm text-[var(--ink-soft)]">
                    Yana bir o&apos;ylab ko&apos;r — matnda javob bor.
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
        <section className="space-y-5">
          <div className="card space-y-3 p-6">
            <span className="text-xs font-bold tracking-wide text-[var(--ink-soft)] uppercase">
              {task.typeLabel} · {taskIndex + 1}/{story.tasks.length}
            </span>
            <p className="kid-text font-bold">{task.prompt}</p>
          </div>

          {question && (
            <div className="card space-y-3 border-[var(--leaf)] p-6">
              <p className="text-sm font-bold text-[var(--leaf-deep)]">Ertakchi so&apos;rayapti</p>
              <p className="kid-text">{question}</p>
            </div>
          )}

          {notice && <p className="text-[var(--warn)]">{notice}</p>}

          {!flagged && (
            <AnswerInput
              value={answer}
              onChange={setAnswer}
              onSubmit={submitAnswer}
              busy={busy}
              preferVoice={preferVoice}
              placeholder={question ? "Savolga javobingni qo'sh..." : "O'z g'oyangni yoz yoki gapir..."}
              submitLabel={question ? "Qo'shdim" : "Tayyor"}
            />
          )}

          <div className="flex items-center gap-3">
            <button className="btn btn-quiet" onClick={nextTask}>
              {taskIndex + 1 < story.tasks.length ? "Keyingi topshiriq" : "Bog'ga o'tish"}
            </button>
            <button className="btn btn-quiet" onClick={() => goTo("bog")}>
              Daraxtimni ko&apos;rish
            </button>
          </div>

          <div className="card p-4">
            <Tree tree={tree} className="mx-auto h-64 w-full max-w-xs" />
          </div>
        </section>
      )}

      {stage === "bog" && (
        <section className="space-y-5">
          <div className="card p-6">
            <Tree tree={tree} className="mx-auto h-80 w-full max-w-sm" />
            <div className="mt-4 space-y-3">
              <p className="kid-text font-bold">
                Bugun daraxtingda {tree.totalIdeas} ta shox
                {tree.totalFlowers > 0 && `, ${tree.totalFlowers} ta gul`}
                {tree.totalLeaves > 0 && `, ${tree.totalLeaves} ta barg`} paydo bo&apos;ldi.
              </p>
              <TreeLegend categories={tree.categories} />
            </div>
          </div>
          <div className="flex gap-3">
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
        <section className="card space-y-4 p-6">
          <p className="kid-text font-bold">Bugungi eng qiziq g&apos;oyam qaysi edi?</p>
          <textarea
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            rows={3}
            className="kid-text card w-full p-4 outline-none focus:border-[var(--leaf-deep)]"
            placeholder="O'zing uchun yozib qo'y..."
          />
          <button className="btn btn-primary" onClick={finish}>
            Saqlash
          </button>
          {notice && <p className="text-[var(--leaf-deep)]">{notice}</p>}
        </section>
      )}
    </div>
  );
}
