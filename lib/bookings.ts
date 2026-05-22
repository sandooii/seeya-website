import type {
  BookingRow,
  BookingStatus,
  CurrencyCode,
  Profile,
  TripRow,
} from "./supabase/types";

/**
 * Booking joined with its trip (and optionally its client profile).
 * Used by admin pages that need both rows together.
 */
export type BookingWithTrip = BookingRow & {
  trip: Pick<
    TripRow,
    "id" | "slug" | "name" | "country" | "image_url" | "month" | "status"
  > | null;
  client_profile?: Pick<Profile, "id" | "full_name" | "phone" | "email"> | null;
};

/** Returns the display name for the booking (inline OR profile fallback). */
export function bookingClientName(b: BookingWithTrip): string {
  return (
    b.client_name?.trim() ||
    b.client_profile?.full_name?.trim() ||
    "بدون اسم"
  );
}

/** Returns the phone for the booking (inline OR profile fallback). */
export function bookingClientPhone(b: BookingWithTrip): string | null {
  return b.client_phone?.trim() || b.client_profile?.phone?.trim() || null;
}

/** Returns the email for the booking (inline OR profile fallback). */
export function bookingClientEmail(b: BookingWithTrip): string | null {
  return b.client_email?.trim() || b.client_profile?.email?.trim() || null;
}

/** Returns the amount remaining to be paid (>= 0). */
export function remainingAmount(b: Pick<BookingRow, "total_amount" | "paid_amount">): number {
  return Math.max(0, Number(b.total_amount) - Number(b.paid_amount));
}

/** Returns 0..100 — what % of the total has been paid. */
export function paymentProgress(b: Pick<BookingRow, "total_amount" | "paid_amount">): number {
  const total = Number(b.total_amount);
  if (total <= 0) return 0;
  const pct = (Number(b.paid_amount) / total) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Format a price with its currency for display. */
export function formatBookingPrice(amount: number, currency: CurrencyCode): string {
  const num = Number(amount).toLocaleString("en-US");
  return currency === "USD" ? `$${num}` : `${num} ₪`;
}

/** Arabic label for each booking status. */
export const bookingStatusLabel: Record<BookingStatus, string> = {
  pending_deposit: "بانتظار المقدّم",
  deposit_paid: "دفعت المقدّم",
  paid_full: "مدفوع بالكامل",
  cancelled: "ملغية",
};

/** Tailwind classes for the status pill. */
export const bookingStatusColor: Record<BookingStatus, string> = {
  pending_deposit: "bg-amber-100 text-amber-700 border-amber-200",
  deposit_paid: "bg-coral/10 text-coral border-coral/20",
  paid_full: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-ink/10 text-ink/60 border-ink/15",
};

/** Booking statuses that count toward a trip's "spots taken". */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "deposit_paid",
  "paid_full",
];

/** Whether a booking should be counted against trip.available_spots. */
export function bookingCountsAsTaken(status: BookingStatus): boolean {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}
