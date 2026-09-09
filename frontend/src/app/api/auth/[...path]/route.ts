import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/');
  if (!['login', 'register', 'refresh-token', 'logout', 'session', 'profile'].includes(path)) {
    return new NextResponse(null, { status: 404 });
  }
  try {
    const headers = new Headers();
    for (const name of ['content-type', 'cookie', 'origin', 'x-requested-with', 'authorization']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const upstream = await fetch(new URL(`/api/auth/${path}`, process.env.AUTH_SERVICE_URL || 'http://localhost:3001'), {
      method: request.method, headers,
      body: request.method === 'POST' ? await request.text() : undefined,
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(10000),
    });
    const response = new NextResponse(upstream.body, { status: upstream.status });
    for (const name of ['content-type', 'set-cookie']) {
      const value = upstream.headers.get(name);
      if (value) response.headers.set(name, value);
    }
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
  }
}
export { proxy as GET, proxy as POST };
