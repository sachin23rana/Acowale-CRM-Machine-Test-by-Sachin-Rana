import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ─── GET /api/health ──────────────────────────────────────────────────────────
export async function GET() {
  const path = '/api/health';
  const timestamp = new Date().toISOString();
  console.log(`[GET ${path}] incoming`);

  try {
    // Lightweight DB probe — just count rows, no full scan
    const { error } = await supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    console.log(`[GET ${path}] ok`);
    return NextResponse.json({ status: 'ok', timestamp });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB unreachable';
    console.error(`[GET ${path}] degraded`, err);
    return NextResponse.json(
      { status: 'degraded', error: message, timestamp },
      { status: 503 }
    );
  }
}
