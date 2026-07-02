import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

// Un-typed client — we cast explicitly at the call site in db.ts
// This avoids the Database generic constraint issues with strict mode + supabase-js v2
export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Row types (manually defined — avoids supabase gen types CLI dependency) ──
export interface FeedbackRow {
  id: string;
  category: string;
  comment: string;
  email: string | null;
  rating: number | null;
  status: string;
  created_at: string;
}

export interface FeedbackInsert {
  category: string;
  comment: string;
  email?: string | null;
  rating?: number | null;
  status?: string;
  created_at?: string;
}

export interface FeedbackUpdate {
  status?: string;
}
