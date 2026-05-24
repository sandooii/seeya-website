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
