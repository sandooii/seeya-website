-- SeeYa initial schema
-- Migration 0001 — profiles, trips, bookings, waitlist
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run

-- ─────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────────────────────

create type user_role as enum ('client', 'admin');

create type trip_status as enum ('live', 'open', 'soon', 'completed', 'sold-out');

create type currency_code as enum ('ILS', 'USD');

create type booking_status as enum (
  'pending_deposit',  -- waiting for deposit payment
  'deposit_paid',     -- deposit received, rest pending
  'paid_full',        -- fully paid
  'cancelled'         -- cancelled by client or admin
);

create type waitlist_status as enum (
  'waiting',          -- on the waitlist
  'offered',          -- a seat opened up, offered to her
  'converted',        -- she accepted and was booked
  'declined',         -- she declined the seat
  'cancelled'         -- removed from waitlist
);

-- ─────────────────────────────────────────────────────────────
-- 2. PROFILES — extends auth.users with role and contact info
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,                -- WhatsApp number (international format)
  email         text,                -- mirrored from auth.users for convenience
  role          user_role not null default 'client',
  admin_notes   text,                -- private notes (only admins can see)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'User profiles — clients and admins. id matches auth.users.id.';

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.phone, new.raw_user_meta_data->>'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 3. TRIPS — replaces hardcoded data.ts entries
-- ─────────────────────────────────────────────────────────────

create table public.trips (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,        -- 'thailand', 'bansko'
  name              text not null,                -- 'تايلاند · بوكيت'
  country           text not null,
  month             text not null,                -- display string '26.06.2026 – 06.07.2026'
  start_date        date,                         -- for sorting / reminders
  end_date          date,
  duration          text not null,                -- '11 يوم'
  price             numeric(10, 2) not null default 0,
  currency          currency_code not null default 'ILS',
  total_spots       int not null default 10,
  available_spots   int not null default 10,
  status            trip_status not null default 'soon',
  badge             text not null,
  image_url         text not null,
  blurb             text not null,
  includes          jsonb not null default '[]'::jsonb,   -- array of strings
  itinerary         jsonb not null default '[]'::jsonb,   -- array of {day, title, desc}
  price_subtitle    text,
  deposit           text,
  deadline          text,                          -- display string
  pdf_path          text,                          -- Supabase Storage path
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.trips is 'All trips — replaces components/data.ts. Admin manages via /admin.';

create index trips_status_idx on public.trips(status);
create index trips_sort_idx on public.trips(sort_order);
create index trips_slug_idx on public.trips(slug);

create trigger trips_updated_at
  before update on public.trips
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 4. BOOKINGS — confirmed bookings (deposit or full)
-- ─────────────────────────────────────────────────────────────

create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.profiles(id) on delete cascade,
  trip_id         uuid not null references public.trips(id) on delete restrict,
  status          booking_status not null default 'pending_deposit',
  total_amount    numeric(10, 2) not null,
  deposit_amount  numeric(10, 2) not null default 0,
  paid_amount     numeric(10, 2) not null default 0,
  currency        currency_code not null default 'ILS',
  notes           text,
  admin_notes     text,                            -- private admin-only notes
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, trip_id)                      -- one booking per client per trip
);

create index bookings_client_idx on public.bookings(client_id);
create index bookings_trip_idx on public.bookings(trip_id);
create index bookings_status_idx on public.bookings(status);

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 5. WAITLIST — for sold-out trips (e.g. Thailand)
-- Doesn't require a profile/account — anyone can join via the
-- public waitlist form. Admin promotes them later.
-- ─────────────────────────────────────────────────────────────

create table public.waitlist (
  id                       uuid primary key default gen_random_uuid(),
  trip_id                  uuid not null references public.trips(id) on delete cascade,
  full_name                text not null,
  phone                    text not null,
  email                    text,
  notes                    text,                   -- "preferred room type", etc.
  status                   waitlist_status not null default 'waiting',
  converted_to_booking_id  uuid references public.bookings(id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index waitlist_trip_idx on public.waitlist(trip_id);
create index waitlist_status_idx on public.waitlist(status);

create trigger waitlist_updated_at
  before update on public.waitlist
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table public.profiles  enable row level security;
alter table public.trips     enable row level security;
alter table public.bookings  enable row level security;
alter table public.waitlist  enable row level security;

-- Helper: is the current user an admin?
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

-- ─── PROFILES policies ───
-- Each user reads/updates their own row; admins see all.
create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = 'client');   -- can't self-promote to admin

create policy "profiles_admin_update"
  on public.profiles for update
  using (public.is_admin());

create policy "profiles_admin_delete"
  on public.profiles for delete
  using (public.is_admin());

-- ─── TRIPS policies ───
-- Anyone (even unauthenticated) can read trips.
-- Only admins can write.
create policy "trips_public_read"
  on public.trips for select
  using (true);

create policy "trips_admin_insert"
  on public.trips for insert
  with check (public.is_admin());

create policy "trips_admin_update"
  on public.trips for update
  using (public.is_admin());

create policy "trips_admin_delete"
  on public.trips for delete
  using (public.is_admin());

-- ─── BOOKINGS policies ───
-- Clients see their own bookings; admins see all.
create policy "bookings_self_read"
  on public.bookings for select
  using (auth.uid() = client_id or public.is_admin());

create policy "bookings_admin_insert"
  on public.bookings for insert
  with check (public.is_admin());

create policy "bookings_admin_update"
  on public.bookings for update
  using (public.is_admin());

create policy "bookings_admin_delete"
  on public.bookings for delete
  using (public.is_admin());

-- ─── WAITLIST policies ───
-- Anyone can sign up (insert). Only admins can read/update/delete.
create policy "waitlist_public_insert"
  on public.waitlist for insert
  with check (true);

create policy "waitlist_admin_read"
  on public.waitlist for select
  using (public.is_admin());

create policy "waitlist_admin_update"
  on public.waitlist for update
  using (public.is_admin());

create policy "waitlist_admin_delete"
  on public.waitlist for delete
  using (public.is_admin());
