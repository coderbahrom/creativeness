import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, roleAllows, verifyToken } from "@/lib/auth";

/**
 * Himoyalangan hududlar. /dars ataylab ochiq: o'quvchi parol kiritmaydi,
 * u faqat ism tanlaydi va daraxt o'stiradi.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value);

  const required = pathname.startsWith("/admin") ? "admin" : "oqituvchi";
  if (!roleAllows(role, required)) {
    const login = request.nextUrl.clone();
    login.pathname = "/kirish";
    login.searchParams.set("keyin", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/oqituvchi/:path*"],
};
