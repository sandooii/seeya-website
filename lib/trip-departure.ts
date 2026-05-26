/**
 * Canonical "the group lifts off at" timestamp for a trip.
 *
 * Pure helper — kept in its own file so client components can import
 * it without dragging the server-only Supabase client (which lives in
 * `lib/trips.ts`) into the browser bundle.
 *
 * Combines the trip's start date with the companion-content outbound
 * flight time so the home / account / mobile countdowns all tick to
 * the exact same moment for everyone on the trip. Per-booking flight
 * overrides are intentionally NOT consulted — the shared countdown
 * tracks the group's flight, not the personal one.
 *
 * Priority: companion.flight.departure_date > startDate. The time
 * falls back to 00:00 when no departure_time is set.
 *
 * The date+time string is parsed as the visitor's local time, which is
 * correct for SeeYa's Israel-based audience. Returns null when nothing
 * usable is known.
 */
export function tripDepartureMs(input: {
  startDate?: string | null;
  companion?: {
    flight?: { departure_date?: string; departure_time?: string };
  } | null;
}): number | null {
  const flight = input.companion?.flight;
  const date = flight?.departure_date ?? input.startDate ?? null;
  if (!date) return null;
  const time =
    flight?.departure_time && /^\d{2}:\d{2}/.test(flight.departure_time)
      ? flight.departure_time
      : "00:00";
  const ts = Date.parse(`${date}T${time}`);
  return Number.isNaN(ts) ? null : ts;
}
