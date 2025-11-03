import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "~/server/auth/config";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/auth"];
const authRoutes = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and auth API endpoints
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // If user is authenticated and tries to access auth pages, redirect to dashboard
    if (authRoutes.some((route) => pathname.startsWith(route))) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return NextResponse.next();
  }

  // Protect all other routes
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
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
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};