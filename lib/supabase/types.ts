/**
 * Hand-written TypeScript types for the public schema.
 *
 * These mirror /supabase/migrations/0001_init.sql. If you change the
 * schema, update this file too — or run `supabase gen types typescript`
 * to regenerate automatically.
 */

export type UserRole = "client" | "admin";

export type TripStatusDB =
  | "live"
  | "open"
  | "soon"
  | "completed"
  | "sold-out";

export type CurrencyCode = "ILS" | "USD";

export type BookingStatus =
  | "pending_deposit"
  | "deposit_paid"
  | "paid_full"
  | "cancelled";

export type WaitlistStatus =
  | "waiting"
  | "offered"
  | "converted"
  | "declined"
  | "cancelled";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TripItineraryItem = {
  day: string;
  title: string;
  desc: string;
};

// ─────────────────────────────────────────────────────────────
// Trip Companion — per-trip travel guide. Edited from
// /admin/trips/[id]/companion, shown to clients in
// /account/trips/[bookingId]. Stored as a single JSONB blob
// on trips.companion_content (migration 0006). All keys optional —
// the UI tolerates partial content.
// ─────────────────────────────────────────────────────────────

export type FlightInfo = {
  departure_date?: string;        // ISO date, e.g. "2026-06-26"
  departure_time?: string;        // "23:30"
  departure_airport?: string;     // "TLV"
  departure_airport_name?: string;// "Ben Gurion"
  arrival_airport?: string;       // "BKK"
  arrival_airport_name?: string;  // "Suvarnabhumi"
  airline?: string;               // "El Al"
  flight_number?: string;         // "LY 81"
  duration?: string;              // "11h 30m"
  notes?: string;                 // "اوصلي للمطار قبل 3 ساعات"
};

export type HotelInfo = {
  name?: string;
  address?: string;
  checkin?: string;               // "15:00"
  checkout?: string;              // "11:00"
  phone?: string;
  map_url?: string;
  notes?: string;
};

export type RecommendationItem = {
  title: string;
  description?: string;
  url?: string;
  category?: string;
};

export type RestaurantItem = {
  name: string;
  cuisine?: string;
  address?: string;
  note?: string;
  url?: string;
};

export type TripCompanion = {
  flight?: FlightInfo;
  hotel?: HotelInfo;
  recommendations?: RecommendationItem[];
  restaurants?: RestaurantItem[];
  warnings?: string[];
  tips?: string[];
  packing?: string[];
};

export type TripRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  month: string;
  start_date: string | null;
  end_date: string | null;
  duration: string;
  price: number;
  currency: CurrencyCode;
  total_spots: number;
  available_spots: number;
  status: TripStatusDB;
  badge: string;
  image_url: string;
  blurb: string;
  includes: string[];
  itinerary: TripItineraryItem[];
  price_subtitle: string | null;
  deposit: string | null;
  deadline: string | null;
  pdf_path: string | null;
  sort_order: number;
  companion_content: TripCompanion;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  /**
   * Nullable when the booking was recorded manually before the
   * client had an account. When NULL, the inline
   * client_name/client_phone/client_email fields hold the contact info.
   * Admin can link a manual booking to a client account via the
   * "convert to client" flow or the booking form's client picker.
   */
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  trip_id: string;
  status: BookingStatus;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  currency: CurrencyCode;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WaitlistRow = {
  id: string;
  trip_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: WaitlistStatus;
  converted_to_booking_id: string | null;
  created_at: string;
  updated_at: string;
};
