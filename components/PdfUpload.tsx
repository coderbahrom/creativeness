"use client";

import { useRef, useState } from "react";

/**
 * PDF yuklash zonasi: bosish ham, sudrab tashlash ham ishlaydi.
 * Ichida haqiqiy <input type="file"> turadi — forma server action'ga
 * odatdagidek yuboriladi, mijoz tomonda hech qanday yuklash mantiqi yo'q.
 */

const MAX_MB = 15;

function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function PdfUpload({
  name = "pdf",
  currentPath,
}: {
  name?: string;
  currentPath?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Rad etilgan fayl input ichida qolmasligi kerak — aks holda forma uni yuboradi. */
  function reject(message: string) {
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setError(message);
  }

  function accept(picked: File | undefined | null) {
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".pdf")) {
      reject("Faqat PDF fayl yuklash mumkin.");
      return;
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      reject(`Fayl juda katta (${formatSize(picked.size)}). Chegara — ${MAX_MB} MB.`);
      return;
    }
    setError(null);
    setFile(picked);
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files;
    if (!dropped.length) return;
    // Tanlangan faylni haqiqiy input'ga ko'chiramiz — forma o'shani yuboradi
    if (inputRef.current) inputRef.current.files = dropped;
    accept(dropped[0]);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setError(null);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        id="pdf"
        name={name}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--leaf)] bg-[var(--surface)] p-4">
          <PdfIcon />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{file.name}</p>
            <p className="text-sm text-[var(--ink-soft)]">
              {formatSize(file.size)} · saqlaganda yuklanadi
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="btn btn-quiet px-4 py-1.5 text-sm"
          >
            Olib tashlash
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-5 text-left transition ${
            dragging
              ? "border-[var(--leaf)] bg-[color-mix(in_oklab,var(--leaf)_12%,transparent)]"
              : "border-[var(--line-strong)] bg-[var(--surface-sunk)] hover:border-[var(--leaf)]"
          }`}
        >
          <PdfIcon muted={!dragging} />
          <span className="min-w-0">
            <span className="block font-bold">
              {dragging ? "Faylni shu yerga tashlang" : "PDF faylni tanlang yoki bu yerga tashlang"}
            </span>
            <span className="block text-sm text-[var(--ink-soft)]">
              Ixtiyoriy. Matn maydoni bo&apos;sh bo&apos;lsa, matn PDFdan avtomatik olinadi —
              keyin tekshirib tuzatasiz. {MAX_MB} MB gacha.
            </span>
          </span>
        </button>
      )}

      {error && (
        <p role="alert" className="font-bold text-[var(--warn)]">
          {error}
        </p>
      )}

      {currentPath && !file && (
        <p className="text-sm text-[var(--ink-soft)]">
          Joriy fayl:{" "}
          <a
            href={currentPath}
            target="_blank"
            className="font-bold text-[var(--leaf-deep)] hover:underline"
          >
            ochish ↗
          </a>{" "}
          — yangi fayl yuklasangiz, u almashadi.
        </p>
      )}
    </div>
  );
}

function PdfIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-10 w-10 shrink-0"
      fill="none"
      stroke={muted ? "var(--ink-soft)" : "var(--leaf-deep)"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 18v-6" />
      <path d="M9.5 14.5 12 12l2.5 2.5" />
    </svg>
  );
}
