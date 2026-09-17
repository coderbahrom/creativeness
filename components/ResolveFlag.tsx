"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Xavfsizlik belgisi qo'yilgan javob ballanmaydi — o'qituvchi faqat ko'rib
 * chiqqanini belgilaydi (7.4-bo'lim). Tizim hech qanday xulosa chiqarmaydi.
 */
export function ResolveFlag({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  async function resolve() {
    setState("saving");
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ safetyResolved: true }),
      });
      if (!res.ok) throw new Error(String(res.status));
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={state === "saving"}
        onClick={resolve}
        className="btn btn-quiet px-4 py-2 text-sm"
      >
        {state === "saving" ? "Saqlanyapti…" : "Ko'rib chiqildi — belgini olib tashlash"}
      </button>
      {state === "error" && (
        <p role="alert" className="text-sm font-bold text-[var(--warn)]">
          Saqlanmadi — qayta urinib ko&apos;ring
        </p>
      )}
    </div>
  );
}
