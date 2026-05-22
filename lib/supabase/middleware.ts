/**
 * Session-refresh helper used by Next.js middleware (../middleware.ts).
 * Without this, Supabase auth cookies expire and users get logged out.
 *
 * Also enforces the "must be logged in" rule for protected routes
 * like /account and /admin (except their public sub-routes like /admin/login).
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that LIVE under a protected prefix but should remain public.
// Add to this list whenever you create a public auth-related sub-route.
const PUBLIC_AUTH_ROUTES = [
  "/admin/login",
  "/admin/logout",     // POST endpoint
  "/login",
  "/signup",
  "/account/logout",   // POST endpoint
  "/auth/callback",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session cookie. Do NOT add any logic between createServerClient
  // and getUser() — it can break the session refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Skip auth check for public auth routes
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isPublicAuthRoute) {
    return supabaseResponse;
  }

  // Protected routes — redirect to the right login page if not authenticated.
  const isAdminRoute = pathname.startsWith("/admin");
  const isAccountRoute = pathname.startsWith("/account");

  if ((isAdminRoute || isAccountRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminRoute ? "/admin/login" : "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
