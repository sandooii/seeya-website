import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Plane,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Download,
  Gift,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  BookingRow,
  BookingStatus,
  CurrencyCode,
  TripRow,
} from "@/lib/supabase/types";
import {
  bookingStatusColor,
  bookingStatusLabel,
  formatBookingPrice,
  paymentProgress,
  remainingAmount,
} from "@/lib/bookings";
import { getTripPdfUrl } from "@/lib/pdfs";
import { waLink, CONTACT } from "@/lib/contact";
import LiveCountdown from "@/components/account/LiveCountdown";
import { tripDepartureMs } from "@/lib/trip-departure";

export const metadata = { title: "رحلاتي — SeeYa" };

type BookingWithTrip = BookingRow & {
  trip: Pick<
    TripRow,
    | "id"
    | "slug"
    | "name"
    | "country"
    | "image_url"
    | "month"
    | "duration"
    | "start_date"
    | "pdf_path"
    | "updated_at"
    | "companion_content"
  > | null;
};

type SearchParams = Promise<{ linked?: string }>;

export default async function AccountHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { linked } = await searchParams;
  const linkedCount = Math.max(0, Number(linked ?? 0));

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "صديقتي";

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select(
      `
        *,
        trip:trips(id, slug, name, country, image_url, month, duration, start_date, pdf_path, updated_at, companion_content)
      `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = (bookingsData ?? []) as BookingWithTrip[];

  // Pick the SINGLE "featured" booking: the soonest upcoming non-cancelled
  // trip. It gets the big hero card with countdown + CTA. Everything else
  // (past or extra future bookings) shows as a compact card below.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const featured = bookings
    .filter(
      (b) =>
        b.trip?.start_date &&
        new Date(b.trip.start_date) >= today &&
        b.status !== "cancelled",
    )
    .sort((a, b) => {
      const da = new Date(a.trip!.start_date!).getTime();
      const db = new Date(b.trip!.start_date!).getTime();
      return da - db;
    })[0];

  const otherBookings = bookings.filter((b) => b.id !== featured?.id);

  // Compute reminder banners
  const reminders = computeReminders(bookings);

  const waMessage = `أهلاً يا فريق SeeYa، معكِ ${profile?.full_name ?? ""}`;

  return (
    <div className="space-y-8" dir="rtl">
      {/* ─── Hero greeting ─── */}
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black text-ink">
          أهلاً يا {firstName} ✨
        </h1>
      </header>

      {linkedCount > 0 && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <CheckCircle2
            className="text-emerald-600 shrink-0 mt-0.5"
            size={20}
          />
          <div>
            <p className="text-emerald-800 font-bold text-sm">
              ربطنا حجوزاتك السابقة 🎉
            </p>
            <p className="text-emerald-700/80 text-xs mt-0.5">
              لقينا {linkedCount} حجز ربطناه بحسابك تلقائياً.
            </p>
          </div>
        </div>
      )}

      {/* ─── Reminder banners ─── */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((r, i) => (
            <ReminderBanner key={i} {...r} />
          ))}
        </div>
      )}

      {/* ─── Featured booking — image + countdown + CTA in one card ─── */}
      {featured && featured.trip && <FeaturedBookingCard booking={featured} />}

      {/* ─── Other bookings (past, extra future) ─── */}
      {otherBookings.length > 0 && (
        <section>
          <header className="mb-4">
            <h2 className="text-2xl font-black text-ink">
              {featured ? "باقي رحلاتي" : "رحلاتي"}
            </h2>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherBookings.map((b) => (
              <CompactBookingCard key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Empty state — no bookings at all ─── */}
      {bookings.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-ink/15 p-8 md:p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-coral/8 text-coral mx-auto mb-3 grid place-items-center">
            <Plane size={28} />
          </div>
          <h3 className="font-black text-ink text-lg">ما عندك حجوزات بعد</h3>
          <p className="text-sm text-ink/60 mt-2 max-w-md mx-auto">
            تصفّحي رحلاتنا واختاري وجهتك، وللحجز كلميني مباشرة على الواتساب
            وبكون معاكِ كل خطوة.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
            <Link
              href="/#trips"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-coral text-white text-sm font-bold hover:brightness-110 transition-colors"
            >
              <ArrowLeft size={14} />
              تصفحي الرحلات
            </Link>
            <a
              href={waLink("مرحبا، حابة احجز رحلة 🌍")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
            >
              <MessageCircle size={14} />
              كلميني للحجز
            </a>
          </div>
        </div>
      )}

      {/* ─── Floating WhatsApp button ─── */}
      <a
        href={waLink(waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="كلمينا على واتساب"
        className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-[0_20px_50px_-15px_rgba(16,185,129,0.6)] transition-all hover:scale-105 active:scale-95"
      >
        <MessageCircle size={18} />
        <span className="text-sm">كلميني</span>
      </a>

      <p className="text-center text-ink/40 text-xs pt-8">
        أي سؤال؟ كلمينا على{" "}
        <a
          href={waLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-coral hover:underline"
          dir="ltr"
        >
          {CONTACT.whatsappDisplay}
        </a>
      </p>
    </div>
  );
}

// ─── Featured booking card — the upcoming trip ───
// Image + dates + countdown overlaid on the hero, smart payment status
// + prominent "Open trip guide" CTA underneath. Replaces the old
// duplicated (hero countdown card + smaller booking card) layout.

function FeaturedBookingCard({ booking }: { booking: BookingWithTrip }) {
  const trip = booking.trip!;
  const pdfUrl = getTripPdfUrl(trip.pdf_path, trip.updated_at);
  // Personalized countdown — uses the booking's per-flight override
  // when set so each client sees HER departure time, not the group's.
  const departureMs = tripDepartureMs({
    startDate: trip.start_date,
    companion: trip.companion_content,
    flightOverride: booking.flight_override?.outbound,
  });

  return (
    <article className="bg-white rounded-3xl border border-ink/5 overflow-hidden shadow-sm">
      {/* Hero with image + countdown overlay */}
      <div className="relative aspect-[21/9] md:aspect-[24/9] text-white">
        <Image
          src={trip.image_url}
          alt={trip.name}
          fill
          priority
          className="object-cover"
          sizes="(min-width: 768px) 80vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/35 to-black/55" />

        <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between">
          {/* Top-left badge */}
          <div className="flex justify-start">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[11px] font-bold border border-white/30">
              ✦ رحلتك القادمة
            </span>
          </div>

          {/* Bottom: title + countdown (responsive: stacked on mobile, row on desktop) */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-black drop-shadow-lg leading-tight">
                {trip.name}
              </h2>
              <p className="text-white/90 text-xs md:text-sm mt-1 tabular-nums">
                <bdi>{trip.month}</bdi> · <bdi>{trip.duration}</bdi>
              </p>
            </div>
            {departureMs !== null && <LiveCountdown targetMs={departureMs} />}
          </div>
        </div>
      </div>

      {/* Body: smart payment + actions */}
      <div className="p-5 md:p-6 space-y-5">
        <PaymentStatus booking={booking} />

        <div className="flex flex-col sm:flex-row gap-3 border-t border-ink/5 -mx-5 md:-mx-6 px-5 md:px-6 pt-4">
          {/* Primary CTA — guide */}
          <Link
            href={`/account/trips/${booking.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_10px_30px_-10px_rgba(249,92,107,0.6)]"
          >
            <span>افتحي دليل الرحلة</span>
            <ArrowLeft size={16} />
          </Link>

          {/* Secondary — PDF */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-coral/8 text-coral font-bold hover:bg-coral/15 active:scale-[0.98] transition-all sm:w-auto"
            >
              <Download size={16} />
              <span>تنزيل PDF</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Smart payment status ───
// 4 cases:
//   1. trip is a comp / gift (total = 0) → ✓ رحلتك جاهزة
//   2. paid in full → ✓ مدفوع بالكامل
//   3. partial payment → progress bar + remaining + WhatsApp
//   4. nothing paid yet → amber "بانتظار المقدّم" + WhatsApp

function PaymentStatus({ booking }: { booking: BookingWithTrip }) {
  const total = Number(booking.total_amount);
  const paid = Number(booking.paid_amount);
  const remaining = remainingAmount(booking);
  const pct = paymentProgress(booking);
  const status: BookingStatus = booking.status;
  const currency: CurrencyCode = booking.currency;

  if (status === "cancelled") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-ink/5 text-ink/55 text-sm font-bold">
        رحلة ملغية
      </div>
    );
  }

  // Comp / gift trip — total is 0, so no money story to tell.
  if (total === 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200">
        <Gift size={16} />
        رحلتك جاهزة
      </div>
    );
  }

  // Fully paid.
  if (paid >= total) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200">
        <CheckCircle2 size={16} />
        مدفوع بالكامل
      </div>
    );
  }

  // Partial — show progress + remaining + ping-us link.
  if (paid > 0) {
    // Render the filled bar with a minimum visible width when any payment
    // exists, so a 1%-paid booking still shows a clear coral nub rather
    // than a barely-visible line.
    const fillWidth = pct > 0 && pct < 3 ? 3 : pct;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs gap-3">
          <span className="text-ink/65 font-semibold">
            دفعت{" "}
            <bdi className="tabular-nums">
              {formatBookingPrice(paid, currency)}
            </bdi>{" "}
            من{" "}
            <bdi className="tabular-nums">
              {formatBookingPrice(total, currency)}
            </bdi>
          </span>
          <span className="text-ink/45 tabular-nums" dir="ltr">
            {Math.round(pct)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-ink/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-coral transition-all"
            style={{ width: `${fillWidth}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-ink/70">
            متبقي{" "}
            <bdi className="font-bold text-ink tabular-nums">
              {formatBookingPrice(remaining, currency)}
            </bdi>
          </p>
          <a
            href={waLink(
              `بدي أدفع باقي رحلة ${booking.trip?.name ?? ""}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-coral hover:underline"
          >
            <MessageCircle size={12} />
            كلميني لإتمام الدفع
          </a>
        </div>
      </div>
    );
  }

  // Nothing paid yet (pending deposit).
  return (
    <div className="flex flex-col gap-2.5">
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold border border-amber-200 self-start">
        <AlertCircle size={16} />
        بانتظار دفع المقدّم لتأكيد الحجز
      </div>
      <p className="text-xs text-ink/70">
        إجمالي الرحلة{" "}
        <bdi className="font-bold text-ink tabular-nums">
          {formatBookingPrice(total, currency)}
        </bdi>{" "}
        — كلميني وبنرتّب طريقة الدفع.
      </p>
      <a
        href={waLink(`بدي أدفع مقدّم رحلة ${booking.trip?.name ?? ""}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 rounded-full text-sm font-bold text-white bg-coral hover:brightness-110 transition-all shadow-[0_6px_18px_-6px_rgba(255,90,74,0.55)]"
      >
        <MessageCircle size={14} />
        كلميني للدفع
      </a>
    </div>
  );
}

// ─── Compact card — for non-featured bookings (past, multiple future) ───

function CompactBookingCard({ booking }: { booking: BookingWithTrip }) {
  const trip = booking.trip;
  const pdfUrl = trip ? getTripPdfUrl(trip.pdf_path, trip.updated_at) : null;
  const total = Number(booking.total_amount);
  const paid = Number(booking.paid_amount);

  return (
    <article className="bg-white rounded-3xl border border-ink/5 overflow-hidden flex flex-col">
      {trip && (
        <div className="relative aspect-[16/9]">
          <Image
            src={trip.image_url}
            alt={trip.name}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute top-3 right-3">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${bookingStatusColor[booking.status]}`}
            >
              {bookingStatusLabel[booking.status]}
            </span>
          </div>
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="text-xl font-black text-ink">
            {trip?.name ?? "رحلة محذوفة"}
          </h3>
          {trip && (
            <div className="flex items-center gap-3 text-xs text-ink/60 mt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {trip.month}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {trip.duration}
              </span>
            </div>
          )}
        </div>

        {/* Minimal payment hint — full detail lives on the guide page */}
        {booking.status !== "cancelled" && total > 0 && (
          <p className="text-xs text-ink/55">
            {paid >= total ? (
              <span className="text-emerald-600 font-bold">
                ✓ مدفوع بالكامل
              </span>
            ) : (
              <>
                دفعت{" "}
                <bdi className="font-bold text-ink tabular-nums">
                  {formatBookingPrice(paid, booking.currency)}
                </bdi>{" "}
                من{" "}
                <bdi className="tabular-nums">
                  {formatBookingPrice(total, booking.currency)}
                </bdi>
              </>
            )}
          </p>
        )}
        {booking.status !== "cancelled" && total === 0 && (
          <p className="text-xs text-emerald-600 font-bold">✓ رحلتك جاهزة</p>
        )}

        <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
          <Link
            href={`/account/trips/${booking.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-coral text-white text-xs font-bold hover:brightness-110 transition-colors"
          >
            دليل الرحلة ←
          </Link>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-coral/8 text-coral text-xs font-bold hover:bg-coral/15 transition-colors"
            >
              <Download size={13} />
              PDF
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Reminder logic (banner-style, computed at render time) ───

type ReminderTone = "amber" | "coral" | "emerald";

type Reminder = {
  tone: ReminderTone;
  icon: React.ReactNode;
  title: string;
  body?: string;
  cta?: { label: string; href: string };
};

function ReminderBanner({
  tone,
  icon,
  title,
  body,
  cta,
}: {
  tone: ReminderTone;
  icon: React.ReactNode;
  title: string;
  body?: string;
  cta?: { label: string; href: string };
}) {
  const toneClasses: Record<ReminderTone, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    coral: "bg-coral/8 border-coral/25 text-coral-dark",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${toneClasses[tone]}`}
    >
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="font-bold text-sm">{title}</p>
        {body && <p className="text-xs opacity-80 mt-0.5">{body}</p>}
      </div>
      {cta && (
        <Link href={cta.href} className="text-xs font-bold underline shrink-0">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function computeReminders(bookings: BookingWithTrip[]): Reminder[] {
  const out: Reminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const b of bookings) {
    if (b.status === "cancelled" || !b.trip) continue;
    const startDate = b.trip.start_date ? new Date(b.trip.start_date) : null;

    // Trip in <= 7 days
    if (startDate) {
      const diff = Math.ceil(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff > 0 && diff <= 7) {
        const whenLabel =
          diff === 1
            ? "بكرة"
            : diff === 2
              ? "بعد يومين"
              : `بعد ${diff} أيام`;
        out.push({
          tone: "coral",
          icon: <Plane size={18} />,
          title: `رحلة ${b.trip.name} ${whenLabel} ✨`,
          body: "وقت تحضّري الشنطة وتجهّزي للسفر!",
        });
      }
    }

    // Payment-outstanding reminder removed — the featured booking
    // card already shows the remaining amount + a 'كلميني للدفع' CTA
    // right above where this banner used to render, so the banner was
    // pure duplication.
  }

  return out;
}
