"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkPassword, createToken, type Role } from "@/lib/auth";

export async function login(formData: FormData) {
  const role = formData.get("rol") === "admin" ? "admin" : ("oqituvchi" as Role);
  const parol = String(formData.get("parol") ?? "");
  const keyin = String(formData.get("keyin") ?? "");

  if (!checkPassword(role, parol)) {
    redirect(`/kirish?xato=1&rol=${role}${keyin ? `&keyin=${encodeURIComponent(keyin)}` : ""}`);
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createToken(role), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 10,
  });

  // keyin faqat ichki yo'l bo'lishi mumkin — tashqi manzilga yo'naltirmaymiz
  const target = keyin.startsWith("/") && !keyin.startsWith("//") ? keyin : null;
  redirect(target ?? (role === "admin" ? "/admin" : "/oqituvchi"));
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
