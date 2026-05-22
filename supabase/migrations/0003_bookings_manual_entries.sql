-- SeeYa — Phase 3: Bookings support for manual entries
-- Migration 0003 — make client_id nullable + add inline client info
--
-- WHY:
-- Until OTP login launches, clients don't have profiles. SANDO records
-- bookings she gets via WhatsApp manually. The booking row needs to
-- carry the client's name/phone/email inline. When OTP launches later,
-- we can link these rows back to real profiles.
--
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run

-- ─────────────────────────────────────────────────────────────
-- 1. Make client_id nullable
-- ─────────────────────────────────────────────────────────────

alter table public.bookings
  alter column client_id drop not null;

-- ─────────────────────────────────────────────────────────────
-- 2. Add inline client info columns
-- ─────────────────────────────────────────────────────────────

alter table public.bookings
  add column if not exists client_name  text,
  add column if not exists client_phone text,
  add column if not exists client_email text;

-- ─────────────────────────────────────────────────────────────
-- 3. CHECK constraint — must have either client_id OR (name+phone)
-- ─────────────────────────────────────────────────────────────

alter table public.bookings
  drop constraint if exists bookings_client_info_required;

alter table public.bookings
  add constraint bookings_client_info_required
  check (
    client_id is not null
    or (client_name is not null and client_phone is not null)
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Replace UNIQUE(client_id, trip_id) with a partial index
-- so multiple manual bookings (client_id NULL) on the same trip
-- are allowed but logged-in clients can still only book once.
-- ─────────────────────────────────────────────────────────────

alter table public.bookings
  drop constraint if exists bookings_client_id_trip_id_key;

create unique index if not exists bookings_client_trip_unique
  on public.bookings(client_id, trip_id)
  where client_id is not null;

-- ─────────────────────────────────────────────────────────────
-- 5. Helpful index for searching by phone (admin search)
-- ─────────────────────────────────────────────────────────────

create index if not exists bookings_client_phone_idx
  on public.bookings(client_phone)
  where client_phone is not null;
