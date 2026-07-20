import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Server-side (middleware) calls use the internal Docker URL when available,
// falling back to the public URL for local dev.
const API_BASE_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

const authRoutes = ["/sign-in", "/sign-up"];

function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    authRoutes.some((route) => pathname.startsWith(route))
  );
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as {
      success?: boolean;
      data?: unknown;
    };

    return data?.success === true && data.data != null;
  } catch (error) {
    console.error("Session check failed in middleware", error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    // Redirect already-authenticated users away from the auth pages.
    if (authRoutes.some((route) => pathname.startsWith(route))) {
      if (await hasValidSession(request)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Protect everything else.
  if (!(await hasValidSession(request))) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
