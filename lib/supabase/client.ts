/**
 * Supabase client for use in Client Components ("use client" files).
 *
 * Uses the new publishable API key system (sb_publishable_...).
 * This key is safe to expose in the browser as long as Row Level Security (RLS)
 * is enabled on every table.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
