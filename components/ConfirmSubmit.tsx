"use client";

/**
 * Qaytarib bo'lmaydigan amallar uchun tasdiqlovchi tugma.
 * Server action formasi ichida ishlaydi: tasdiqlanmasa submit bo'lmaydi.
 */
export function ConfirmSubmit({
  message,
  className,
  children,
  ariaLabel,
}: {
  message: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
