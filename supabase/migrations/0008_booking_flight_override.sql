-- Per-booking flight override.
-- When a late addition gets a different flight from the rest of the
-- group, we don't want to mutate the trip's default flight info. So
-- each booking can carry its own optional flight payload that wins
-- over the trip-level companion flight when set.
--
-- Shape:
--   {
--     "outbound":      { ...FlightInfo },
--     "return_flight": { ...FlightInfo }
--   }
-- Either side is optional. When a side is absent or empty, the
-- corresponding trip-level companion flight is shown instead.

alter table public.bookings
  add column if not exists flight_override jsonb;

comment on column public.bookings.flight_override is
  'Optional per-booking flight info override. Same shape as trip.companion_content.flight, with both an outbound and return_flight slot. Falls back to trip defaults when unset.';
