import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Single-admin write model: browsing/search/graph are public, everything that
// mutates knowledge requires the one admin session. See README "Auth model".
// (Next.js 16 renamed the "middleware" convention to "proxy" — same network
// boundary, but it always runs on the Node.js runtime now, not edge.)
const PROTECTED_PAGE_PREFIXES = ["/capture"];
const PROTECTED_EDIT_SUFFIX = "/edit";
const PROTECTED_API_PREFIXES = ["/api/v1/notes", "/api/v1/domains", "/api/v1/collections", "/api/v1/tags", "/api/v1/links"];
const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function isProtectedPage(pathname: string) {
  if (PROTECTED_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/n/") && pathname.endsWith(PROTECTED_EDIT_SUFFIX)) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApiMutation =
    MUTATING_METHODS.has(req.method) &&
    PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isProtectedPage(pathname) && !isApiMutation) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/capture/:path*", "/n/:slug/edit", "/api/v1/:path*"],
};
