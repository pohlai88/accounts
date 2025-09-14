import { NextRequest, NextResponse } from 'next/server';

const BUDGET_MS = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? 1500);

async function withTimeout<T>(p: Promise<T>, ms = BUDGET_MS): Promise<T> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await p;
  } finally {
    clearTimeout(t);
  }
}

async function check(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await withTimeout(fn());
    return { status: 'healthy' as const, responseTime: Math.round(performance.now() - start) };
  } catch (e: unknown) {
    return {
      status: 'degraded' as const,
      responseTime: Math.round(performance.now() - start),
      error: String(e?.message ?? e)
    };
  }
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const timestamp = new Date().toISOString();

  // In dev, keep it lightweight
  if (process.env.NODE_ENV !== 'production') {
    const ok = {
      status: 'ok',
      services: {
        database: { status: 'healthy', responseTime: 0 },
        storage: { status: 'healthy', responseTime: 0 },
        auth: { status: 'healthy', responseTime: 0 },
        api: { status: 'healthy', responseTime: 0 }
      },
      version: process.env.APP_VERSION ?? 'dev',
      timestamp,
      uptime: process.uptime()
    };
    return NextResponse.json(ok, { status: 200 });
  }

  // Absolute origin for /api/ping to avoid recursion and proxies
  const origin = process.env.PUBLIC_BASE_URL ||
    (req.headers.get('x-forwarded-host') ?
      `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('x-forwarded-host')}` :
      'http://localhost:3001');

  const [database, storage, auth, api] = await Promise.all([
    // Quick DB ping - replace with your actual DB check
    check('database', async () => {
      // Add your actual DB ping here
      await new Promise(resolve => setTimeout(resolve, 10)); // Simulate quick DB check
    }),
    // Quick storage ping - replace with your actual storage check
    check('storage', async () => {
      // Add your actual storage ping here
      await new Promise(resolve => setTimeout(resolve, 5)); // Simulate quick storage check
    }),
    // Supabase JWKS reachability — keep short
    check('auth', async () => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), BUDGET_MS);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/jwks`, { signal: ctl.signal });
        if (!res.ok) throw new Error(`jwks http ${res.status}`);
      } finally {
        clearTimeout(t);
      }
    }),
    // ✅ This hits the trivial /api/ping we created above
    check('api', async () => {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), BUDGET_MS);
      try {
        const res = await fetch(`${origin}/api/ping`, { signal: ctl.signal });
        if (!res.ok) throw new Error(`ping http ${res.status}`);
      } finally {
        clearTimeout(t);
      }
    })
  ]);

  const services = { database, storage, auth, api };
  const overall = Object.values(services).every(s => s.status === 'healthy') ? 'ok' : 'degraded';

  return NextResponse.json({
    status: overall,
    timestamp,
    services,
    version: process.env.APP_VERSION ?? 'unknown',
    uptime: process.uptime()
  }, { status: overall === 'ok' ? 200 : 503 });
}
