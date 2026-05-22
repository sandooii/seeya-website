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

export const destinations = [
  "تايلاند",
  "بانسكو",
  "زنجيبار",
  "أمريكا",
  "اليونان",
  "المالديف",
  "إسطنبول",
  "طوكيو",
  "لشبونة",
  "ميكونوس",
  "كابادوكيا",
  "مراكش",
];

export const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=900&q=80",
    alt: "بنات في رحلة على البحر",
    span: "row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=900&q=80",
    alt: "شارع باريسي",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
    alt: "حقول بالي",
    span: "row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=900&q=80",
    alt: "غروب الشاطئ",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
    alt: "جبال الثلج",
    span: "",
  },
];

export const avatars = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
];

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
