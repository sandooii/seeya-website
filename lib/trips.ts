/**
 * Public trip data — single source for the marketing site.
 *
 * Fetches from Supabase (via the server client, so RLS applies). The
 * `trips` table has a public read policy so this works even for
 * unauthenticated visitors.
 *
 * Returns trips in the legacy `Trip` shape so existing components
 * (Trips, Countdown, TripModal) keep working without internal changes.
 * The shape adapter `dbTripToLegacy()` is the only place that knows
 * about the difference between DB column names and the legacy field
 * names — keep it small.
 */
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripRow } from "@/lib/supabase/types";
import type { Trip } from "@/components/data";
import { getTripPdfUrl } from "@/lib/pdfs";

export function dbTripToLegacy(row: TripRow): Trip {
  return {
    id: row.slug,
    name: row.name,
    country: row.country,
    month: row.month,
    startDate: row.start_date,
    endDate: row.end_date,
    duration: row.duration,
    price: Number(row.price),
    currency: row.currency === "USD" ? "$" : "₪",
    spots: row.available_spots,
    totalSpots: row.total_spots,
    status: row.status,
    badge: row.badge,
    image: row.image_url,
    blurb: row.blurb,
    itinerary: row.itinerary,
    includes: row.includes,
    priceSubtitle: row.price_subtitle ?? undefined,
    deposit: row.deposit ?? undefined,
    deadline: row.deadline ?? undefined,
    // Convert the storage key (e.g. "uuid.pdf") into a full public URL
    // so <TripModal>'s download button just consumes a fetchable href.
    pdf: getTripPdfUrl(row.pdf_path, row.updated_at) ?? undefined,
    // Trip companion content (activities, flight, tips, etc.) drives
    // the rich sections in TripModal so admin edits propagate live.
    companion: row.companion_content ?? undefined,
  };
}

/**
 * Fetch all trips for the public-facing site, ordered the way they
 * should appear on the homepage.
 *
 * Returns an empty array on error so the page can still render — the
 * worst case is the Trips section showing "no trips yet" instead of
 * the whole page crashing.
 */
export async function getTripsForPublic(): Promise<Trip[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getTripsForPublic] Supabase error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => dbTripToLegacy(row as TripRow));
}

export function findTripBySlug(trips: Trip[], slug: string): Trip | null {
  return trips.find((t) => t.id === slug) ?? null;
}

/**
 * Canonical "the group lifts off at" timestamp for a trip.
 *
 * Combines the trip's start date with the companion-content outbound
 * flight time so the home / account / mobile countdowns all tick to
 * the exact same moment for everyone on the trip (it ignores the
 * per-booking flight override — that's a personal info on the trip
 * detail page, not the shared group countdown).
 *
 * Priority: companion.flight.departure_date > startDate; time falls
 * back to 00:00 when no departure_time is set.
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
