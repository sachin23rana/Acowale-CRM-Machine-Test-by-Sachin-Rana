import { NextRequest, NextResponse } from 'next/server';
import { updateFeedbackStatus, deleteFeedback, ALLOWED_STATUSES } from '@/lib/db';

// ─── PATCH /api/feedback/[id] ─────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const path = `/api/feedback/${id}`;
  console.log(`[PATCH ${path}] incoming`);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { status } = body as { status?: string };

  if (!status || !ALLOWED_STATUSES.includes(status as never)) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}.` },
      { status: 400 }
    );
  }

  try {
    const updated = await updateFeedbackStatus(id, status as never);
    if (!updated) {
      console.warn(`[PATCH ${path}] not found`);
      return NextResponse.json({ error: 'Feedback not found.' }, { status: 404 });
    }
    console.log(`[PATCH ${path}] success — status → ${status}`);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[PATCH ${path}] error`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE /api/feedback/[id] ────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const path = `/api/feedback/${id}`;
  console.log(`[DELETE ${path}] incoming`);

  try {
    const deleted = await deleteFeedback(id);
    if (!deleted) {
      console.warn(`[DELETE ${path}] not found`);
      return NextResponse.json({ error: 'Feedback not found.' }, { status: 404 });
    }
    console.log(`[DELETE ${path}] success`);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[DELETE ${path}] error`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
