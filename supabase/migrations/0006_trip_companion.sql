-- SeeYa — Phase 7B: Trip Companion content
-- Migration 0006 — add companion_content JSONB to trips
--
-- Why: each trip needs a rich travel companion page for clients —
-- flight details, hotel, restaurant recommendations, warnings, tips,
-- packing list. One blob per trip (shared across all bookings on that
-- trip — admin manages it once and every booked client sees the same
-- info).
--
-- Shape (TypeScript: lib/supabase/types.ts → TripCompanion):
-- {
--   "flight":           { departure_date, departure_time, ... },
--   "hotel":            { name, address, checkin, checkout, ... },
--   "recommendations":  [{ title, description, url, category }, ...],
--   "restaurants":      [{ name, cuisine, address, note, url }, ...],
--   "warnings":         ["string", ...],
--   "tips":             ["string", ...],
--   "packing":          ["string", ...]
-- }
--
-- Missing keys are fine — the UI tolerates partial content.

alter table public.trips
  add column if not exists companion_content jsonb not null default '{}'::jsonb;

comment on column public.trips.companion_content is
  'Per-trip travel guide content: flight, hotel, recommendations, restaurants, warnings, tips, packing. Shared across all bookings on this trip.';
