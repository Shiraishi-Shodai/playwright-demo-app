import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { RedirectType } from "next/navigation";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "super-secret-key-for-jwt-that-is-at-least-32-bytes-long"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/api/session")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session")?.value;

  // セッションが保持されていない場合、ログイン画面へリダイレクト
  if (!session) {
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(session, secret);
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  } catch (err) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  // マッチした時、middlewareがフィルターを行う
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
