import type { TripCompanion } from "@/lib/supabase/types";

export type TripStatus = "live" | "completed" | "soon" | "open" | "sold-out";

export type Trip = {
  id: string;
  name: string;
  country: string;
  month: string;
  duration: string;
  price: number;
  /** "₪" for ILS, "$" for USD. Defaults to USD when omitted. */
  currency?: "₪" | "$";
  spots: number;
  /** Original total spots before bookings — used to show "X of Y booked" widgets */
  totalSpots?: number;
  status: TripStatus;
  badge: string;
  image: string;
  blurb: string;
  itinerary: { day: string; title: string; desc: string }[];
  includes: string[];
  /** Small line under the price in the modal */
  priceSubtitle?: string;
  /** Deposit pill text shown in the modal */
  deposit?: string;
  /** Registration deadline shown in the modal */
  deadline?: string;
  /** PDF program URL — when set, modal renders a download button */
  pdf?: string;
  /**
   * Trip companion content — activities, flight info, tips, etc.
   * Editable from /admin/trips/[id]/companion. Optional — sections
   * fall back to hardcoded defaults in TripModal when missing.
   */
  companion?: TripCompanion;
};

/** Returns the formatted price string, or null when there's no price to show. */
export function formatPrice(trip: Trip): string | null {
  if (trip.price <= 0) return null;
  const num = trip.price.toLocaleString("en-US");
  return trip.currency === "₪" ? `${num} ₪` : `$${num}`;
}

// NOTE: trips data lives in Supabase now.
// - Public fetcher: `lib/trips.ts` → `getTripsForPublic()` (used by app/page.tsx)
// - Admin CRUD: `app/admin/(dash)/trips/`
// - DB type:   `lib/supabase/types.ts` → `TripRow`
//
// This module keeps the legacy `Trip` shape so existing client components
// (Trips, Countdown, TripModal) consume the same fields as before — the
// DB→legacy adapter lives in `lib/trips.ts`.

export const faqs = [
  {
    q: "شو مشمول بسعر الرحلة؟",
    a: "السعر شامل: الطيران ذهاباً وإياباً، الفندق، التنقلات الداخلية، النشاطات الرئيسية، المرافقة العربية 24/7، ونقل VIP من وإلى المطار.",
  },
  {
    q: "أنا مسافرة لحالي — مناسب؟",
    a: "طبعاً! معظم بناتنا بيجوا لحالهن وبيرجعوا صديقات من العمر، يعني أجواء حلوة وآمنة.",
  },
  {
    q: "كيف بتم الحجز والدفع؟",
    a: "تواصلي معنا على الواتساب، منرسلكِ كل تفاصيل الرحلة، وبتحجزي مكانكِ بدفع مقدم عشان نأكد محلك بالرحلة.",
  },
  {
    q: "شو سياسة الإلغاء؟",
    a: "عندنا سياسة إلغاء مرنة. التفاصيل كلها بملف سياسة الإلغاء، اضغطي عليه للتحميل.",
  },
  {
    q: "شو إذا كنت ما بعرف حدا بالمجموعة؟",
    a: "هذا أحلى جزء بالرحلة! كثير من البنات أجوا لحالهن ورجعوا بصاحبات من العمر.",
  },
];
