import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware for /profile.
 *
 * BetAction stores auth tokens in module-level memory (not cookies), so true
 * server-side protection isn't available in Edge middleware. The primary guard
 * is the client-side `useEffect` redirect inside each protected page component.
 *
 * Once the app switches to HttpOnly cookie-based refresh tokens, replace the
 * `NextResponse.next()` below with a cookie check + redirect, e.g.:
 *
 *   const session = request.cookies.get('betaction-session');
 *   if (!session) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*'],
};
