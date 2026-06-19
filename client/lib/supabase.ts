"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cloud sync is OPTIONAL and env-gated. With no Supabase env vars the app runs
// exactly as before (localStorage only) — `supabase` is null and every sync
// call no-ops. Set both vars (locally in .env.local, or on Vercel) to enable:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = !!(url && anonKey);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
