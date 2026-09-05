import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('betaction-session')?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    try {
      const response = await fetch(new URL('/api/auth/session', process.env.AUTH_SERVICE_URL || 'http://localhost:3001'), {
        headers: { Cookie: `betaction-session=${token}` }, cache: 'no-store', signal: AbortSignal.timeout(5000),
      });
      if (response.status === 204) return NextResponse.next();
    } catch { /* Fail closed when the session service is unavailable. */ }
  }
  return NextResponse.redirect(new URL('/login', request.url));
}
export const config = { matcher: ['/profile/:path*'] };
