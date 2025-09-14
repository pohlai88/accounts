import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // avoid caching

export async function GET() {
    return NextResponse.json({ ok: true }, { status: 200 });
}
