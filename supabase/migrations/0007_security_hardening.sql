-- SeeYa — Security hardening per Supabase advisors (2026-05-24)
--
-- Applied via Supabase MCP `apply_migration`. Saved here so the
-- next clone of the repo reproduces production schema.
--
-- 4 fixes:
-- 1. Drop the broad public SELECT policy on storage.objects for trip-pdfs.
--    Public URLs (/storage/v1/object/public/...) still work because the
--    bucket's `public` flag bypasses RLS for that endpoint. This just stops
--    anon/authenticated callers from listing files via the storage REST API.
-- 2. touch_updated_at — pin search_path (mutable search_path warning).
-- 3. handle_new_user — revoke EXECUTE from public-facing roles. The trigger
--    on auth.users still fires (triggers run as the table owner), but it
--    can no longer be called as /rest/v1/rpc/handle_new_user.
-- 4. is_admin — switch from SECURITY DEFINER to SECURITY INVOKER. The body
--    only reads the caller's own profile row, which the existing
--    `profiles_self_read` RLS policy already permits, so admin-checking
--    inside other RLS policies keeps working.

-- 1. Drop the broad storage SELECT policy.
drop policy if exists "trip_pdfs_public_read" on storage.objects;

-- 2. Pin search_path on touch_updated_at.
alter function public.touch_updated_at() set search_path = '';

-- 3. handle_new_user: trigger-only, lock it out of the REST API.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- 4. is_admin: switch to SECURITY INVOKER. RLS policies that call this
--    keep working because the function only reads `profiles where id =
--    auth.uid()`, which `profiles_self_read` already allows the caller.
alter function public.is_admin() security invoker;
