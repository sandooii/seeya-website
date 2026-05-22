import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Logout handler — POST /admin/logout
 *
 * Returns HTTP 303 so the browser switches to GET when following the
 * redirect (otherwise it would re-POST to the new URL).
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const url = new URL("/admin/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
