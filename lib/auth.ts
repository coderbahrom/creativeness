/**
 * MVP autentifikatsiya: ikkita rol, ikkita parol (env), imzolangan cookie.
 *
 *   admin      → /admin      — sinf, o'quvchi, ertak boshqaruvi
 *   oqituvchi  → /oqituvchi  — sinf xaritasi va baholar (admin ham kira oladi)
 *
 * O'quvchi hech qachon parol kiritmaydi (7 yoshli bola parol yozmaydi) —
 * /dars ochiq qoladi, unda shaxsiy kabinet yo'q.
 *
 * Web Crypto ishlatiladi: bir xil kod middleware (edge) va server actionda ishlaydi.
 */

export type Role = "admin" | "oqituvchi";

export const SESSION_COOKIE = "eb_sessiya";
const SESSION_TTL_MS = 1000 * 60 * 60 * 10; // bir ish kuni

function adminParol() {
  return process.env.ADMIN_PAROL ?? "admin2026";
}
function oqituvchiParol() {
  return process.env.OQITUVCHI_PAROL ?? "oqituvchi2026";
}

/** Parollar env da o'rnatilmagan bo'lsa login sahifasida ogohlantiramiz. */
export function usingDefaultPasswords() {
  return !process.env.ADMIN_PAROL || !process.env.OQITUVCHI_PAROL;
}

export function checkPassword(role: Role, parol: string): boolean {
  const expected = role === "admin" ? adminParol() : oqituvchiParol();
  // Uzunlikni tenglashtirib solishtirish — taqqoslash vaqti sizmasin
  if (parol.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= parol.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function secret() {
  return (
    process.env.SESSION_SECRET ?? `ertak-bogi:${adminParol()}:${oqituvchiParol()}`
  );
}

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createToken(role: Role): Promise<string> {
  const payload = `${role}.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifyToken(token: string | undefined): Promise<Role | null> {
  if (!token) return null;
  const [role, exp, sig] = token.split(".");
  if (!role || !exp || !sig) return null;
  if ((role !== "admin" && role !== "oqituvchi") || Number(exp) < Date.now()) return null;
  if ((await hmac(`${role}.${exp}`)) !== sig) return null;
  return role;
}

/** Rol talab qilingan sahifaga kira oladimi? Admin o'qituvchi hududiga ham kiradi. */
export function roleAllows(actual: Role | null, required: Role): boolean {
  if (!actual) return false;
  if (actual === "admin") return true;
  return actual === required;
}
