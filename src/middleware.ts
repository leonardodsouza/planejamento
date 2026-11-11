import { NextResponse, type NextRequest } from "next/server";

// Checagem rápida: só olha se há cookie de sessão. A validação de verdade
// (sessão existe e não expirou) acontece no servidor, em requireUser().
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("session");
  const path = request.nextUrl.pathname;

  if (!hasSession && !path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
