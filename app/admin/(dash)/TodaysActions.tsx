import Link from "next/link";
import {
  AlertCircle,
  Plane,
  Sparkles,
  Clock,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/supabase/types";

/**
 * "اليوم لازم تتابعي" — the actionable inbox that lives at the top of
 * the admin dashboard. Each row is a thing SANDO can DO right now:
 *
 *   - Bookings whose deposit is overdue (> 5 days as pending_deposit)
 *   - Bookings whose trip leaves within 7 days (last-minute prep)
 *   - New waitlist signups from the last 24 hours
 *   - Trips that don't have a PDF uploaded yet
 *
 * Server-rendered: each row queries the DB independently and short-
 * circuits when empty, so the widget collapses to a single "all
 * clear" line on quiet days.
 *
 * The whole component renders inside the dashboard, no client-side
 * logic — clicks navigate to the page that contains the work.
 */

type ActionRow = {
  /** Unique key for React. */
  key: string;
  /** Lucide icon component. */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Coral / amber / emerald / violet — colors the icon background. */
  tone: "coral" | "amber" | "emerald" | "violet" | "rose";
  /** Big text — describes WHAT needs attention. */
  title: string;
  /** Smaller text underneath — explains WHY. */
  hint: string;
  /** Where the click lands. */
  href: string;
};

const TONE_BG: Record<ActionRow["tone"], string> = {
  coral: "bg-coral/10 text-coral",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
};

export default async function TodaysActions() {
  const supabase = await createServerSupabaseClient();

  // Five-day-old deposit-paid threshold for the "follow-up" bucket.
  // eslint-disable-next-line react-hooks/purity -- intentional server-time read on each request
  const now = Date.now();
  const fiveDaysAgo = new Date(now - 5 * 86_400_000).toISOString();
  const sevenDaysFromNow = new Date(now + 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const todayIso = new Date(now).toISOString().slice(0, 10);
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  // Run all four checks in parallel — they're independent counts.
  const [
    overdueDepositsRes,
    upcomingDeparturesRes,
    newWaitlistRes,
    tripsWithoutPdfRes,
  ] = await Promise.all([
    // 1) Pending deposits older than 5 days
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_deposit" satisfies BookingStatus)
      .lt("created_at", fiveDaysAgo),
    // 2) Trips departing within next 7 days (any non-cancelled booking)
    supabase
      .from("trips")
      .select("id, name, start_date")
      .gte("start_date", todayIso)
      .lte("start_date", sevenDaysFromNow)
      .order("start_date", { ascending: true }),
    // 3) Waitlist entries created in the last 24h
    supabase
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo)
      .eq("status", "waiting"),
    // 4) Trips without a PDF
    supabase
      .from("trips")
      .select("id", { count: "exact", head: true })
      .is("pdf_path", null),
  ]);

  const rows: ActionRow[] = [];

  const overdueCount = overdueDepositsRes.count ?? 0;
  if (overdueCount > 0) {
    rows.push({
      key: "overdue",
      icon: AlertCircle,
      tone: "rose",
      title:
        overdueCount === 1
          ? "حجز واحد بانتظار المقدّم لأكثر من ٥ أيام"
          : `${overdueCount} حجوزات بانتظار المقدّم لأكثر من ٥ أيام`,
      hint: "تابعي مع العميلات قبل ما يفوت الموعد",
      href: "/admin/bookings?status=pending_deposit",
    });
  }

  const upcomingTrips = upcomingDeparturesRes.data ?? [];
  if (upcomingTrips.length > 0) {
    for (const trip of upcomingTrips) {
      if (!trip.start_date) continue;
      const daysUntil = Math.ceil(
        (new Date(trip.start_date).getTime() - now) / 86_400_000,
      );
      rows.push({
        key: `dep-${trip.id}`,
        icon: Plane,
        tone: "violet",
        title:
          daysUntil <= 0
            ? `رحلة ${trip.name} اليوم!`
            : daysUntil === 1
              ? `رحلة ${trip.name} غداً`
              : `رحلة ${trip.name} خلال ${daysUntil} أيام`,
        hint: "ابعتي تذكير ما قبل السفر للعميلات",
        href: `/admin/trips`,
      });
    }
  }

  const newWaitlistCount = newWaitlistRes.count ?? 0;
  if (newWaitlistCount > 0) {
    rows.push({
      key: "waitlist",
      icon: Clock,
      tone: "amber",
      title:
        newWaitlistCount === 1
          ? "طلب قائمة انتظار جديد (آخر ٢٤ ساعة)"
          : `${newWaitlistCount} طلبات قائمة انتظار جديدة (آخر ٢٤ ساعة)`,
      hint: "ردّي عليهن أو حوّليهن لحجز",
      href: "/admin/waitlist",
    });
  }

  const tripsNoPdf = tripsWithoutPdfRes.count ?? 0;
  if (tripsNoPdf > 0) {
    rows.push({
      key: "no-pdf",
      icon: FileText,
      tone: "emerald",
      title:
        tripsNoPdf === 1
          ? "رحلة واحدة بدون ملف PDF"
          : `${tripsNoPdf} رحلات بدون ملف PDF`,
      hint: "ارفعي البرنامج عشان العميلات تقدر تحمّله",
      href: "/admin/pdfs",
    });
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <section className="rounded-3xl bg-gradient-to-br from-coral/5 to-pale border-2 border-coral/15 p-5 md:p-7">
      <header className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-coral/15 text-coral grid place-items-center">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-ink">
            اليوم لازم تتابعي
          </h2>
          <p className="text-ink/55 text-xs md:text-sm">
            مهام جاهزة بضغطة واحدة — كل ما خلصتي وحدة بتنطفي تلقائياً
          </p>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-4">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-ink/75">
            كل شي تحت السيطرة ✨ — لا شي عاجل ينتظر متابعتك اليوم.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <li key={row.key}>
                <Link
                  href={row.href}
                  className="flex items-center gap-3 bg-white hover:bg-coral/5 rounded-2xl px-3 py-3 border border-ink/8 hover:border-coral/30 transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${TONE_BG[row.tone]}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink truncate">
                      {row.title}
                    </p>
                    <p className="text-xs text-ink/55 truncate">{row.hint}</p>
                  </div>
                  <span className="text-coral group-hover:translate-x-[-3px] transition-transform text-lg">
                    ←
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
