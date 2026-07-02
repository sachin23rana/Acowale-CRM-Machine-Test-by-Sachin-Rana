import { supabase, FeedbackRow, FeedbackInsert, FeedbackUpdate } from './supabase';

// ─── Shared Feedback type (used across the app) ───────────────────────────────
export interface Feedback {
  id: string;
  category: 'Product' | 'Feature Request' | 'UI/UX' | 'Support' | 'Billing' | 'Other';
  comment: string;
  email?: string | null;
  rating: number;
  status: 'Open' | 'In Progress' | 'Resolved';
  created_at: string;
}

export const ALLOWED_CATEGORIES = [
  'Product',
  'Feature Request',
  'UI/UX',
  'Support',
  'Billing',
  'Other',
] as const;

export const ALLOWED_STATUSES = ['Open', 'In Progress', 'Resolved'] as const;

// ─── Type-safe cast from raw DB row to Feedback ───────────────────────────────
function toFeedback(row: FeedbackRow): Feedback {
  return {
    id:         row.id,
    category:   row.category as Feedback['category'],
    comment:    row.comment,
    email:      row.email,
    rating:     row.rating ?? 3,
    status:     row.status as Feedback['status'],
    created_at: row.created_at,
  };
}

// ─── GET (list) ───────────────────────────────────────────────────────────────
export async function getFeedbacks(opts?: {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Feedback[]; total: number }> {
  const page  = Math.max(1, opts?.page  ?? 1);
  const limit = Math.min(100, Math.max(1, opts?.limit ?? 20));
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('feedback')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (opts?.category) query = query.eq('category', opts.category);
  if (opts?.status)   query = query.eq('status',   opts.status);
  if (opts?.search)   query = query.ilike('comment', `%${opts.search}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data:  ((data ?? []) as FeedbackRow[]).map(toFeedback),
    total: count ?? 0,
  };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export async function saveFeedback(
  input: Omit<FeedbackInsert, 'status'>
): Promise<Feedback> {
  const insert: FeedbackInsert = {
    category: input.category,
    comment:  input.comment,
    email:    input.email ?? null,
    rating:   input.rating ?? 3,
    status:   'Open',
  };

  const { data, error } = await supabase
    .from('feedback')
    .insert([insert])
    .select()
    .single();

  if (error) throw error;
  return toFeedback(data as FeedbackRow);
}

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────
export async function updateFeedbackStatus(
  id: string,
  status: Feedback['status']
): Promise<Feedback | null> {
  const update: FeedbackUpdate = { status };

  const { data, error } = await supabase
    .from('feedback')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // PGRST116 = no rows matched
    if ((error as { code?: string }).code === 'PGRST116') return null;
    throw error;
  }
  return toFeedback(data as FeedbackRow);
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function deleteFeedback(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from('feedback')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) throw error;
  return (count ?? 0) > 0;
}
