/**
 * Canonical "lifts off at" timestamp for a trip.
 *
 * Pure helper — kept in its own file so client components can import
 * it without dragging the server-only Supabase client (which lives in
 * `lib/trips.ts`) into the browser bundle.
 *
 * Priority (highest wins):
 *   1. `flightOverride.departure_date` + `.departure_time`
 *      — the booking-specific override (when set in admin's booking
 *      form). This is what each client should see on her own account.
 *   2. `companion.flight.departure_date` + `.departure_time`
 *      — the trip's shared/default outbound flight. This is what the
 *      public landing page should show (the majority view).
 *   3. `startDate` at 00:00 — last-resort fallback.
 *
 * The public Countdown component passes only `startDate + companion`
 * (never an override) so all visitors see the same group-wide ticker.
 * The account dashboard + trip-detail page additionally pass the
 * booking's `flight_override.outbound` so each girl's countdown
 * matches HER flight when it differs from the group's.
 *
 * The date+time string is parsed as the visitor's local time, which
 * is correct for SeeYa's Israel-based audience. Returns null when
 * nothing usable is known.
 */
export function tripDepartureMs(input: {
  startDate?: string | null;
  companion?: {
    flight?: { departure_date?: string; departure_time?: string };
  } | null;
  flightOverride?: {
    departure_date?: string;
    departure_time?: string;
  } | null;
}): number | null {
  // Try override first, then trip default, then startDate-only.
  const candidates = [
    input.flightOverride,
    input.companion?.flight,
    { departure_date: input.startDate ?? undefined, departure_time: undefined },
  ];

  for (const c of candidates) {
    const date = c?.departure_date;
    if (!date) continue;
    const time =
      c.departure_time && /^\d{2}:\d{2}/.test(c.departure_time)
        ? c.departure_time
        : "00:00";
    const ts = Date.parse(`${date}T${time}`);
    if (!Number.isNaN(ts)) return ts;
  }

  return null;
}
