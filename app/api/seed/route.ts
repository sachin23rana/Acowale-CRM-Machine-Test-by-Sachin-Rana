import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { FeedbackInsert } from '@/lib/supabase';

const SEED_FEEDBACKS: FeedbackInsert[] = [
  { category: 'Product',         comment: "Loving the new dashboard! It's so intuitive.",                                   email: 'sarah.j@example.com',  rating: 5, status: 'Resolved',    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { category: 'Feature Request', comment: 'Can we get dark mode in the next update? Our developers would love it.',          email: 'mike.d@example.com',   rating: 4, status: 'In Progress', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { category: 'Support',         comment: 'The reporting feature is not exporting CSV files correctly.',                     email: 'alex.n@example.com',   rating: 2, status: 'Open',        created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString() },
  { category: 'Product',         comment: 'Great product! Helped our team streamline our CRM process in less than a week.',  email: 'tina.w@example.com',   rating: 5, status: 'Resolved',    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { category: 'Billing',         comment: 'Billing page needs more clarity. The invoice details are a bit confusing.',       email: 'john.k@example.com',   rating: 3, status: 'Open',        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  { category: 'UI/UX',           comment: 'The font size in the sidebar navigation is too small on smaller screens.',        email: 'kyle.b@example.com',   rating: 4, status: 'In Progress', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
  { category: 'Other',           comment: 'Does your API support webhooks for user registration events?',                    email: 'emma.l@example.com',   rating: 4, status: 'Resolved',    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString() },
  { category: 'Product',         comment: 'Dashboard loading speed has decreased significantly since the last update.',      email: 'dave.m@example.com',   rating: 2, status: 'In Progress', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { category: 'Feature Request', comment: 'Integrations with Slack and Microsoft Teams would be a game changer.',            email: 'rachel.t@example.com', rating: 5, status: 'Open',        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() },
  { category: 'Billing',         comment: 'I got double charged this month. Can support look into this immediately?',        email: 'stan.p@example.com',   rating: 1, status: 'In Progress', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString() },
  { category: 'UI/UX',           comment: 'The color scheme is beautiful, but contrast could be improved for accessibility.', email: 'olivia.h@example.com', rating: 4, status: 'Resolved',    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  { category: 'Support',         comment: 'Excellent and swift response from the support team to resolve my routing query.', email: 'robert.c@example.com', rating: 5, status: 'Resolved',    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString() },
  { category: 'Product',         comment: 'Experiencing frequent logouts. The session cookie lifetime is too short.',        email: 'sophie.m@example.com', rating: 3, status: 'Open',        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
  { category: 'Feature Request', comment: 'Please add bulk export of feedback data as JSON or PDF format.',                  email: 'tom.s@example.com',    rating: 4, status: 'Open',        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString() },
  { category: 'UI/UX',           comment: 'The mobile view is a bit cluttered, specifically the main tables and charts.',    email: 'lily.g@example.com',   rating: 3, status: 'In Progress', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString() },
];

// ─── POST /api/seed ────────────────────────────────────────────────────────────
export async function POST() {
  console.log('[POST /api/seed] incoming');
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('feedback') as any)
      .insert(SEED_FEEDBACKS)
      .select();

    if (error) throw error;

    const count = Array.isArray(data) ? data.length : 0;
    console.log(`[POST /api/seed] success — inserted ${count} rows`);
    return NextResponse.json({ message: 'Database seeded successfully', count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[POST /api/seed] error', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
