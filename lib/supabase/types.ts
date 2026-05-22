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
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  /**
   * Nullable until OTP login launches. When NULL, the inline
   * client_name/client_phone/client_email fields hold the contact info
   * (manual WhatsApp bookings recorded by admin).
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
