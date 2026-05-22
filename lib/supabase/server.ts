/**
 * Supabase clients for server-side use in Next.js.
 *
 * - `createServerSupabaseClient()` — uses the publishable key; reads/writes
 *   auth cookies so sessions persist. RLS applies. Use in Server Components,
 *   Route Handlers, and Server Actions.
 *
 * - `createServiceRoleClient()` — uses the SECRET key. Bypasses RLS.
 *   Use only in trusted server contexts (admin operations, background jobs).
 *   Never expose to the browser.
 */
import { createServerClient } from "@supabase/ssr";
import { createClient as createBaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` may be called from a Server Component — that's fine
            // if middleware is also refreshing the session.
          }
        },
      },
    },
  );
}

export function createServiceRoleClient() {
  return createBaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
