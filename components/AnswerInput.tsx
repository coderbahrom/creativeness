"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Kiritish usullari (8-bo'lim).
 *
 * 1–2-sinf uchun ovoz majburiy: 7 yoshli bola klaviaturada yozsa, tizim
 * kreativlikni emas, terish tezligini o'lchaydi.
 *
 * O'zbek tilida bolalar nutqini tanish (STT) ishonchsiz — shuning uchun
 * ovozdan chiqqan matn HAR DOIM tasdiqlash ekraniga tushadi: bola yoki
 * o'qituvchi uni tuzatib, keyin yuboradi. Brauzer STTni qo'llamasa —
 * matn kiritish zaxira sifatida qoladi.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  busy,
  placeholder,
  preferVoice,
  submitLabel = "Tayyor",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  placeholder: string;
  preferVoice: boolean;
  submitLabel?: string;
}) {
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setVoiceSupported(getRecognition() !== null);
    return () => recognitionRef.current?.stop();
  }, []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = getRecognition();
    if (!recognition) {
      setError("Bu brauzerda ovoz ishlamayapti. Javobingni yozib ber.");
      return;
    }
    recognition.lang = "uz-UZ";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += `${event.results[i][0].transcript} `;
      // Tanilgan matn to'g'ridan-to'g'ri yuborilmaydi — tasdiqlash uchun maydonga tushadi.
      onChange(text.trim());
    };
    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "Mikrofonga ruxsat berilmadi. Javobingni yozib ber."
          : "Ovoz tanilmadi. Yana urinib ko'r yoki yozib ber.",
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setError(null);
    recognition.start();
    setListening(true);
  }

  return (
    <div className="space-y-3">
      {preferVoice && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            disabled={busy || !voiceSupported}
            aria-pressed={listening}
            className={`btn ${listening ? "bg-[var(--warn)] text-[var(--btn-ink)]" : "btn-quiet"}`}
          >
            <span
              aria-hidden="true"
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                listening ? "pulse-soft bg-[var(--btn-ink)]" : "bg-[var(--warn)]"
              }`}
            />
            {listening ? "To'xtatish" : "Gapirib berish"}
          </button>
          <span className="text-sm text-[var(--ink-soft)]">
            {listening
              ? "Eshityapman..."
              : voiceSupported
                ? "Gapirganingdan keyin matnni tekshirib chiqasan"
                : "Ovoz mavjud emas — yozib ber"}
          </span>
        </div>
      )}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={busy}
        rows={5}
        className="kid-text field w-full resize-y p-4 disabled:opacity-60"
      />

      {error && (
        <p role="alert" className="text-[var(--warn)]">
          {error}
        </p>
      )}

      {preferVoice && value && (
        <p className="text-sm text-[var(--ink-soft)]">
          Matn to&apos;g&apos;ri yozildimi? Kerak bo&apos;lsa tuzatib qo&apos;y — imlo xatosi ballga
          ta&apos;sir qilmaydi.
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={busy || value.trim().length < 2}
        className="btn btn-primary"
      >
        {busy && (
          <span
            aria-hidden="true"
            className="pulse-soft inline-block h-2.5 w-2.5 rounded-full bg-[var(--btn-ink)]"
          />
        )}
        {busy ? "O'ylayapman..." : submitLabel}
      </button>
    </div>
  );
}
