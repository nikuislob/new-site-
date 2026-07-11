import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("voltora_admin_session")?.value;
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const secret = new TextEncoder().encode(
        process.env.ADMIN_AUTH_SECRET || "dev-admin-secret-not-for-production"
      );
      const { payload } = await jwtVerify(token, secret);
      if (payload.typ !== "admin") throw new Error("invalid");
    } catch {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("voltora_admin_session");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
