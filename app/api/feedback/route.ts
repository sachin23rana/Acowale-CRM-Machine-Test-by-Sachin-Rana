import { NextRequest, NextResponse } from 'next/server';
import { getFeedbacks, saveFeedback, ALLOWED_CATEGORIES } from '@/lib/db';

// ─── In-memory rate limiter (max 10 POST requests / minute / IP) ──────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now   = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

// ─── Email validator ──────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── GET /api/feedback ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const path = '/api/feedback';
  console.log(`[GET ${path}] incoming`);

  try {
    const { searchParams } = req.nextUrl;
    const category = searchParams.get('category')  ?? undefined;
    const status   = searchParams.get('status')    ?? undefined;
    const search   = searchParams.get('search')    ?? undefined;
    const page     = parseInt(searchParams.get('page')  ?? '1',  10);
    const limit    = parseInt(searchParams.get('limit') ?? '20', 10);

    const { data, total } = await getFeedbacks({ category, status, search, page, limit });

    const totalPages = Math.ceil(total / limit);
    console.log(`[GET ${path}] success — returned ${data.length} of ${total}`);

    return NextResponse.json({ data, total, page, totalPages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[GET ${path}] error`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/feedback ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const path = '/api/feedback';
  console.log(`[POST ${path}] incoming`);

  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    console.warn(`[POST ${path}] rate limited — ip: ${ip}`);
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again in a minute.' },
      { status: 429 }
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    console.error(`[POST ${path}] invalid JSON body`);
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { category, comment, email, rating } = body as {
    category?: string;
    comment?:  string;
    email?:    string;
    rating?:   number;
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!category || !ALLOWED_CATEGORIES.includes(category as never)) {
    return NextResponse.json(
      { error: `category is required and must be one of: ${ALLOWED_CATEGORIES.join(', ')}.` },
      { status: 400 }
    );
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length < 3) {
    return NextResponse.json(
      { error: 'comment is required and must be at least 3 characters.' },
      { status: 400 }
    );
  }

  if (comment.trim().length > 1000) {
    return NextResponse.json(
      { error: 'comment must not exceed 1000 characters.' },
      { status: 400 }
    );
  }

  if (email && !EMAIL_RE.test(email.trim())) {
    return NextResponse.json(
      { error: 'email must be a valid email address.' },
      { status: 400 }
    );
  }

  const parsedRating = typeof rating === 'number' ? Math.min(5, Math.max(1, Math.round(rating))) : 3;

  // ── Insert ─────────────────────────────────────────────────────────────────
  try {
    const feedback = await saveFeedback({
      category: category as never,
      comment:  comment.trim(),
      email:    email?.trim() ?? null,
      rating:   parsedRating,
    });

    console.log(`[POST ${path}] success — id: ${feedback.id}`);
    return NextResponse.json(feedback, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[POST ${path}] db error`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
