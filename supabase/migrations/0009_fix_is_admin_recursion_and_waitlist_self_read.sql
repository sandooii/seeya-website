-- Fix #1: is_admin() must be SECURITY DEFINER so it bypasses RLS
-- when reading from profiles. Without this, every RLS check that
-- calls is_admin() triggers a profiles SELECT that itself runs the
-- profiles RLS, which calls is_admin() again — infinite recursion
-- that explodes once the data set grows past a handful of rows.
--
-- All four account-side flows on /account/waitlist + the public
-- join-waitlist server action were dying with `stack depth limit
-- exceeded` because of this.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Lock down execution: only logged-in roles can call it. (Defense in
-- depth — anon doesn't need to know whether anyone is admin.)
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- Fix #2: clients need to SEE their own waitlist entries on
-- /account/waitlist. Previously only admin could SELECT from
-- waitlist, so the page always rendered empty for clients (after the
-- recursion was fixed). Match by the last 9 digits of the phone so
-- "+972 50…" and "0501…" formats both resolve.

-- Helper: strip non-digits to compare phones across formats.
create or replace function public.phone_digits(p text)
returns text
language sql
immutable
as $$
  select coalesce(regexp_replace(p, '\D', '', 'g'), '');
$$;

-- Policy: a client can read a waitlist row when the last 9 digits of
-- the row's phone match the last 9 digits of her profile phone.
create policy waitlist_self_read on public.waitlist
  for select using (
    right(public.phone_digits(phone), 9) = (
      select right(public.phone_digits(p.phone), 9)
      from public.profiles p
      where p.id = auth.uid()
    )
  );
