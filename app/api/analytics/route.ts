import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CategoryCount {
  category: string;
  count: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

// ─── GET /api/analytics ───────────────────────────────────────────────────────
export async function GET() {
  const path = '/api/analytics';
  console.log(`[GET ${path}] incoming`);

  try {
    // ── Total count ──────────────────────────────────────────────────────────
    const { count: total, error: totalErr } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true });

    if (totalErr) throw totalErr;

    // ── Count by category ────────────────────────────────────────────────────
    const { data: catRaw, error: catErr } = await supabase
      .from('feedback')
      .select('category');

    if (catErr) throw catErr;

    const catData = (catRaw ?? []) as { category: string }[];
    const categoryMap: Record<string, number> = {};
    for (const row of catData) {
      categoryMap[row.category] = (categoryMap[row.category] ?? 0) + 1;
    }
    const byCategory: CategoryCount[] = Object.entries(categoryMap).map(
      ([category, count]) => ({ category, count })
    );

    // ── Trend — last 30 days grouped by date ─────────────────────────────────
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: trendRaw, error: trendErr } = await supabase
      .from('feedback')
      .select('created_at')
      .gte('created_at', since.toISOString());

    if (trendErr) throw trendErr;

    const trendMap: Record<string, number> = {};
    for (const row of (trendRaw ?? []) as { created_at: string }[]) {
      const day = row.created_at.slice(0, 10); // YYYY-MM-DD
      trendMap[day] = (trendMap[day] ?? 0) + 1;
    }

    // Fill in every day in the last 30 days (so gaps show as 0)
    const trend: TrendPoint[] = [];
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      trend.push({ date: dateStr, count: trendMap[dateStr] ?? 0 });
    }

    console.log(`[GET ${path}] success — total: ${total}, categories: ${byCategory.length}`);
    return NextResponse.json({ total: total ?? 0, byCategory, trend });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[GET ${path}] error`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
