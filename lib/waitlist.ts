import type {
  TripRow,
  WaitlistRow,
  WaitlistStatus,
} from "./supabase/types";

/** Waitlist row joined with its trip — used by admin pages. */
export type WaitlistWithTrip = WaitlistRow & {
  trip: Pick<
    TripRow,
    "id" | "slug" | "name" | "country" | "image_url" | "month" | "status"
  > | null;
};

/** Arabic label for each waitlist status. */
export const waitlistStatusLabel: Record<WaitlistStatus, string> = {
  waiting: "بانتظار",
  offered: "عُرض عليها مقعد",
  converted: "تحوّلت لحجز",
  declined: "رفضت",
  cancelled: "ألغيت",
};

/** Tailwind classes for the status pill. */
export const waitlistStatusColor: Record<WaitlistStatus, string> = {
  waiting: "bg-amber-100 text-amber-700 border-amber-200",
  offered: "bg-violet-100 text-violet-700 border-violet-200",
  converted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  declined: "bg-ink/10 text-ink/60 border-ink/15",
  cancelled: "bg-ink/10 text-ink/40 border-ink/15",
};

/** Whether this status is "open" — i.e., can still be acted upon. */
export function isWaitlistOpen(status: WaitlistStatus): boolean {
  return status === "waiting" || status === "offered";
}
