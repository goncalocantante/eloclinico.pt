import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth check for public assets and api/auth routes
  if (pathname.startsWith("/api/auth") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      throw: false, // Don't throw on error, just return null session
    }
  );

  // Define protected paths
  const isDashboard = pathname.startsWith("/dashboard");
  const isProtectedApi = 
    pathname.startsWith("/api") && 
    !pathname.startsWith("/api/auth") && 
    !pathname.startsWith("/api/user");

  if (isProtectedApi && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
