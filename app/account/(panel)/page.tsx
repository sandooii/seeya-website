import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Plane,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Download,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingRow, TripRow, WaitlistRow } from "@/lib/supabase/types";
import {
  bookingStatusColor,
  bookingStatusLabel,
  formatBookingPrice,
  paymentProgress,
  remainingAmount,
} from "@/lib/bookings";
import {
  waitlistStatusColor,
  waitlistStatusLabel,
} from "@/lib/waitlist";
import { getTripPdfUrl } from "@/lib/pdfs";
import { waLink, CONTACT } from "@/lib/contact";

export const metadata = { title: "حسابي — SeeYa" };

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
  > | null;
};

type WaitlistWithTrip = WaitlistRow & {
  trip: Pick<TripRow, "id" | "slug" | "name" | "country" | "image_url" | "month"> | null;
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

  // Fetch bookings + waitlist in parallel
  const [bookingsResult, waitlistResult] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        `
        *,
        trip:trips(id, slug, name, country, image_url, month, duration, start_date, pdf_path, updated_at)
      `,
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("waitlist")
      .select(
        `
        *,
        trip:trips(id, slug, name, country, image_url, month)
      `,
      )
      .eq("phone", profile?.phone ?? "__no_phone__")
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (bookingsResult.data ?? []) as BookingWithTrip[];
  const waitlist = (waitlistResult.data ?? []) as WaitlistWithTrip[];

  // Find the soonest upcoming trip (with start_date in the future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = bookings
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

  const daysUntilUpcoming = upcoming?.trip?.start_date
    ? Math.ceil(
        (new Date(upcoming.trip.start_date).getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Compute reminder banners
  const reminders = computeReminders(bookings);

  const waMessage = `أهلاً يا فريق SeeYa، معكِ ${profile?.full_name ?? ""}`;

  return (
    <div className="space-y-8" dir="rtl">
      {/* ─── Hero greeting + countdown ─── */}
      <header className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          أهلاً يا {firstName} ✨
        </h1>
        <p className="text-ink/60 text-lg">
          هاي صفحتك — كل رحلاتك وملفاتك بمكان واحد
        </p>
      </header>

      {linkedCount > 0 && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
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

      {/* ─── Countdown to next trip ─── */}
      {upcoming && upcoming.trip && daysUntilUpcoming !== null && (
        <CountdownCard
          daysUntil={daysUntilUpcoming}
          tripName={upcoming.trip.name}
          tripImage={upcoming.trip.image_url}
          tripMonth={upcoming.trip.month}
          tripDuration={upcoming.trip.duration}
        />
      )}

      {/* ─── Bookings ─── */}
      <section>
        <header className="flex items-baseline justify-between gap-4 mb-4">
          <h2 className="text-2xl font-black text-ink">رحلاتي</h2>
          {bookings.length > 0 && (
            <Link
              href="/account/trips"
              className="text-sm font-bold text-coral hover:underline"
            >
              عرض الكل ←
            </Link>
          )}
        </header>

        {bookings.length === 0 ? (
          <EmptyState
            icon={<Plane size={28} />}
            title="ما عندك حجوزات بعد"
            description="لما تحجزي رحلة، رح تظهر هون مع كل تفاصيلها"
            cta={{ label: "تصفحي الرحلات", href: "/#trips" }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.slice(0, 4).map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Waitlist ─── */}
      {waitlist.length > 0 && (
        <section>
          <header className="flex items-baseline justify-between gap-4 mb-4">
            <h2 className="text-2xl font-black text-ink">قائمة انتظاري</h2>
            <Link
              href="/account/waitlist"
              className="text-sm font-bold text-coral hover:underline"
            >
              عرض الكل ←
            </Link>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitlist.slice(0, 2).map((w) => (
              <WaitlistCard key={w.id} entry={w} />
            ))}
          </div>
        </section>
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

// ─── Components ───

function CountdownCard({
  daysUntil,
  tripName,
  tripImage,
  tripMonth,
  tripDuration,
}: {
  daysUntil: number;
  tripName: string;
  tripImage: string;
  tripMonth: string;
  tripDuration: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl text-white">
      <Image
        src={tripImage}
        alt={tripName}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-black/60" />
      <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold mb-3 border border-white/30">
            <Sparkles size={12} />
            رحلتك القادمة
          </div>
          <h3 className="text-3xl md:text-4xl font-black drop-shadow-lg">
            {tripName}
          </h3>
          <p
            className="text-white/85 text-sm mt-1 tabular-nums"
            dir="ltr"
          >
            {tripMonth} · {tripDuration}
          </p>
        </div>
        <div className="text-center md:text-left bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl px-6 py-4">
          {daysUntil === 0 ? (
            <>
              <div className="text-3xl md:text-4xl font-black leading-none">
                اليوم
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/80 mt-1">
                🎉 سفرك اليوم
              </div>
            </>
          ) : daysUntil === 1 ? (
            <>
              <div className="text-3xl md:text-4xl font-black leading-none">
                غداً
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/80 mt-1">
                بتسافري ✈️
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl md:text-5xl font-black tabular-nums leading-none">
                {daysUntil}
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/80 mt-1">
                {daysUntil === 2
                  ? "يومين وبتسافري"
                  : daysUntil <= 10
                    ? "أيام وبتسافري"
                    : "يوم وبتسافري"}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type ReminderTone = "amber" | "coral" | "emerald";

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

function BookingCard({ booking }: { booking: BookingWithTrip }) {
  const trip = booking.trip;
  const pct = paymentProgress(booking);
  const remaining = remainingAmount(booking);
  const pdfUrl = trip
    ? getTripPdfUrl(trip.pdf_path, trip.updated_at)
    : null;

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

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-ink/55 font-semibold">
              {pct >= 100
                ? "دفعت بالكامل ✓"
                : `دفعت ${formatBookingPrice(booking.paid_amount, booking.currency)} من ${formatBookingPrice(booking.total_amount, booking.currency)}`}
            </span>
            <span className="text-ink/40 tabular-nums" dir="ltr">
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-coral"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {remaining > 0 && booking.status !== "cancelled" && (
            <p
              className="text-xs text-ink/50 mt-1 tabular-nums"
              dir="ltr"
            >
              متبقي {formatBookingPrice(remaining, booking.currency)}
            </p>
          )}
        </div>

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

function WaitlistCard({ entry }: { entry: WaitlistWithTrip }) {
  return (
    <article className="bg-white rounded-3xl border border-ink/5 p-5 flex items-center gap-4">
      {entry.trip && (
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0">
          <Image
            src={entry.trip.image_url}
            alt={entry.trip.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-black text-ink">
          {entry.trip?.name ?? "رحلة محذوفة"}
        </div>
        <div className="text-xs text-ink/55 mt-0.5">
          {entry.trip?.month}
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1.5 ${waitlistStatusColor[entry.status]}`}
        >
          {waitlistStatusLabel[entry.status]}
        </span>
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  title,
  description,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="bg-white rounded-3xl border border-dashed border-ink/15 p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-coral/8 text-coral mx-auto mb-3 grid place-items-center">
        {icon}
      </div>
      <h3 className="font-black text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-ink/55 mt-1.5">{description}</p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-coral text-white text-sm font-bold hover:brightness-110 transition-colors"
        >
          <ArrowLeft size={14} />
          {cta.label}
        </Link>
      )}
    </div>
  );
}

// ─── Reminder logic (banner-style, computed at render time) ───

type Reminder = {
  tone: ReminderTone;
  icon: React.ReactNode;
  title: string;
  body?: string;
  cta?: { label: string; href: string };
};

function computeReminders(bookings: BookingWithTrip[]): Reminder[] {
  const out: Reminder[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const b of bookings) {
    if (b.status === "cancelled" || !b.trip) continue;
    const startDate = b.trip.start_date
      ? new Date(b.trip.start_date)
      : null;
    const remaining = remainingAmount(b);

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

    // Payment outstanding + trip in <= 30 days
    if (
      remaining > 0 &&
      b.status !== "paid_full" &&
      startDate
    ) {
      const diff = Math.ceil(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff > 0 && diff <= 30) {
        out.push({
          tone: "amber",
          icon: <AlertCircle size={18} />,
          title: `لسا في مبلغ متبقي على رحلة ${b.trip.name}`,
          body: `متبقي ${formatBookingPrice(remaining, b.currency)} — احنا هون لو في أي سؤال`,
          cta: {
            label: "كلمينا",
            href: waLink(`بدي أسأل عن دفع رحلة ${b.trip.name}`),
          },
        });
      }
    }
  }

  return out;
}
