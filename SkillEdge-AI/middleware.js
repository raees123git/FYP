import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/sign-in', '/sign-up'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path) || pathname === path);

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected routes, redirect to sign-in
  // Note: Client-side auth check will be done by the AuthProvider
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};