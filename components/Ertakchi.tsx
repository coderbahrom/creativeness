/**
 * Ertakchi — AI bolaga shu qiyofada ko'rinadi (7.1-bo'lim): savol beradi,
 * qiziqadi, hayratlanadi. Hakam emas — shuning uchun ko'zlarida baho yo'q,
 * faqat qiziqish bor. U hech qachon "to'g'ri/noto'g'ri" demaydi.
 */
export function Ertakchi({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Ertakchi">
      <circle cx="24" cy="24" r="24" fill="color-mix(in oklab, var(--leaf) 22%, transparent)" />
      <path d="M12 20 Q 14 9 20 12" stroke="var(--leaf-deep)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M36 20 Q 34 9 28 12" stroke="var(--leaf-deep)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="24" cy="26" rx="13" ry="14" fill="var(--leaf-deep)" />
      <ellipse cx="24" cy="33" rx="8.5" ry="8" fill="color-mix(in oklab, var(--leaf) 55%, var(--surface))" />
      <circle cx="18.5" cy="22" r="5.4" fill="var(--surface)" />
      <circle cx="29.5" cy="22" r="5.4" fill="var(--surface)" />
      <circle cx="19.4" cy="22.4" r="2.5" fill="var(--ink)" />
      <circle cx="28.6" cy="22.4" r="2.5" fill="var(--ink)" />
      <circle cx="20.3" cy="21.4" r="0.9" fill="var(--surface)" />
      <circle cx="29.5" cy="21.4" r="0.9" fill="var(--surface)" />
      <path d="M24 25.4 L 21.4 28 L 26.6 28 Z" fill="var(--bloom)" />
    </svg>
  );
}
