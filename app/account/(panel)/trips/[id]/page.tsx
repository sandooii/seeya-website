import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Plane,
  Hotel,
  Utensils,
  Compass,
  AlertTriangle,
  Lightbulb,
  Luggage,
  Download,
  MessageCircle,
  MapPin,
  Phone,
  ExternalLink,
  ListChecks,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  BookingRow,
  FlightInfo,
  HotelInfo,
  RecommendationItem,
  RestaurantItem,
  TripCompanion,
  TripItineraryItem,
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
import { waLink } from "@/lib/contact";
import LiveCountdown from "@/components/account/LiveCountdown";
import CollapsibleCompanionSection from "@/components/account/CollapsibleCompanionSection";
import { tripDepartureMs } from "@/lib/trip-departure";

export const metadata = { title: "دليل رحلتي — SeeYa" };

type Params = Promise<{ id: string }>;

type BookingWithTrip = BookingRow & {
  trip:
    | (Pick<
        TripRow,
        | "id"
        | "slug"
        | "name"
        | "country"
        | "image_url"
        | "month"
        | "duration"
        | "start_date"
        | "end_date"
        | "pdf_path"
        | "updated_at"
      > & {
        itinerary: TripItineraryItem[];
        includes: string[];
        companion_content: TripCompanion;
      })
    | null;
};

export default async function MyTripDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      trip:trips(
        id, slug, name, country, image_url, month, duration,
        start_date, end_date, pdf_path, updated_at,
        itinerary, includes, companion_content
      )
    `,
    )
    .eq("id", id)
    .eq("client_id", user.id) // RLS already filters, but extra-safe
    .single<BookingWithTrip>();

  if (error || !booking || !booking.trip) notFound();

  const trip = booking.trip;
  const companion: TripCompanion = trip.companion_content ?? {};

  // Countdown
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const daysUntil = startDate
    ? Math.ceil(
        (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  const pct = paymentProgress(booking);
  const remaining = remainingAmount(booking);
  const pdfUrl = getTripPdfUrl(trip.pdf_path, trip.updated_at);

  // Compute the displayed status from the actual payment amounts so the
  // hero badge never claims "مدفوع بالكامل" while there's money still
  // outstanding (the manually-set status field can drift; money doesn't).
  const totalAmount = Number(booking.total_amount);
  const paidAmount = Number(booking.paid_amount);
  const displayStatus: typeof booking.status =
    booking.status === "cancelled"
      ? "cancelled"
      : totalAmount > 0 && paidAmount >= totalAmount
        ? "paid_full"
        : paidAmount > 0
          ? "deposit_paid"
          : "pending_deposit";
  // Personalized countdown — booking.flight_override.outbound wins
  // over the trip's shared companion flight when set.
  const departureMs = tripDepartureMs({
    startDate: trip.start_date,
    companion,
    flightOverride: booking.flight_override?.outbound,
  });

  const waMessage = `أهلاً يا SeeYa، أنا حاجز${"ة"} رحلة ${trip.name} وعندي سؤال`;

  return (
    <div className="space-y-8" dir="rtl">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors"
      >
        <ArrowRight size={14} />
        <span>كل رحلاتي</span>
      </Link>

      {/* Hero — shorter aspect on mobile so the badge + title + countdown
          stack stays compact instead of eating the whole viewport. */}
      <section className="relative overflow-hidden rounded-3xl text-white aspect-[5/4] sm:aspect-[16/10] md:aspect-[21/10]">
        <Image
          src={trip.image_url}
          alt={trip.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/75" />
        <div className="absolute inset-0 p-4 md:p-10 flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${bookingStatusColor[displayStatus]}`}
            >
              {bookingStatusLabel[displayStatus]}
            </span>
            {booking.client_name && (
              <span className="text-white/90 text-xs font-semibold">
                {booking.client_name}
              </span>
            )}
          </div>

          <div className="flex-1" />

          <div className="text-center">
            <h1 className="text-2xl md:text-5xl font-black drop-shadow-lg leading-tight">
              {trip.name}
            </h1>
            <p className="text-white/85 text-[11px] md:text-sm mt-0.5 md:mt-1 tabular-nums">
              <bdi>{trip.month}</bdi> · <bdi>{trip.duration}</bdi>
            </p>
          </div>

          {departureMs !== null && daysUntil !== null && daysUntil >= 0 && (
            <div className="mt-3 md:mt-5 mx-auto w-full max-w-md">
              <LiveCountdown targetMs={departureMs} variant="dark" compact />
            </div>
          )}
        </div>
      </section>

      {/* Payment progress */}
      <section className="bg-white rounded-3xl border border-ink/5 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
          <h2 className="text-lg font-black text-ink">حالة الدفع</h2>
          <div className="text-sm font-bold text-ink tabular-nums">
            <bdi>
              {formatBookingPrice(booking.paid_amount, booking.currency)}
            </bdi>
            <span className="text-ink/40 font-normal">
              {" / "}
              <bdi>
                {formatBookingPrice(booking.total_amount, booking.currency)}
              </bdi>
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-ink/8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-coral"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {remaining > 0 && booking.status !== "cancelled" ? (
          <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
            <p className="text-sm text-ink/70">
              متبقي{" "}
              <bdi>{formatBookingPrice(remaining, booking.currency)}</bdi>
            </p>
            <a
              href={waLink(`بدي أدفع باقي رحلة ${trip.name}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-coral text-sm font-bold hover:underline"
            >
              <MessageCircle size={14} />
              كلمينا لإتمام الدفع
            </a>
          </div>
        ) : (
          pct >= 100 && (
            <p className="text-sm text-emerald-600 font-bold mt-3">
              ✓ مدفوع بالكامل — جاهزة للسفر!
            </p>
          )
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Download size={16} />
            تحميل برنامج الرحلة PDF
          </a>
        )}
        <a
          href={waLink(waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold active:scale-[0.98] transition-all"
        >
          <MessageCircle size={16} />
          كلمينا على واتساب
        </a>
      </section>

      {/* Flights — merge the per-booking override on top of the trip
          default field-by-field, so a client who only had her *time*
          overridden still sees the trip's airport names, airline,
          notes, etc. This keeps the card layout identical for every
          client — they all see the same set of fields, only the values
          differ where the admin chose to personalize. */}
      {(() => {
        const outbound = mergeFlight(
          booking.flight_override?.outbound,
          companion.flight,
        );
        const returnFlight = mergeFlight(
          booking.flight_override?.return_flight,
          companion.return_flight,
        );
        const isOutboundOverride = hasFlight(
          booking.flight_override?.outbound,
        );
        const isReturnOverride = hasFlight(
          booking.flight_override?.return_flight,
        );

        return (
          <>
            {outbound && (
              <CompanionSection
                title="طيران الذهاب 🛫"
                icon={<Plane size={18} />}
                accent="coral"
              >
                {isOutboundOverride && <OverrideBadge />}
                <FlightCard flight={outbound} />
              </CompanionSection>
            )}

            {/* Return flight — show section even when empty, with a
                friendly "coming later" placeholder so the client knows
                this info is on the way. */}
            <CompanionSection
              title="طيران الرجعة 🛬"
              icon={<Plane size={18} />}
              accent="coral"
            >
              {returnFlight ? (
                <>
                  {isReturnOverride && <OverrideBadge />}
                  <FlightCard flight={returnFlight} />
                </>
              ) : (
                <p className="text-sm text-ink/60 bg-ink/3 rounded-2xl px-4 py-5 text-center">
                  ⏳ معلومات طيران الرجعة بتيجي لاحقاً — هنعلمك أول ما تجهز
                </p>
              )}
            </CompanionSection>
          </>
        );
      })()}

      {/* Hotel */}
      {hasHotel(companion.hotel) && (
        <CompanionSection
          title="الفندق"
          icon={<Hotel size={18} />}
          accent="violet"
        >
          <HotelCard hotel={companion.hotel!} />
        </CompanionSection>
      )}

      {/* Ordered by priority for SANDO's audience: pack first, then
          read the warnings, then the daily plan, then nice-to-have
          tips / restaurants / recommendations. */}

      {/* 1. Packing list */}
      {companion.packing && companion.packing.length > 0 && (
        <CollapsibleCompanionSection
          title="قائمة التحضير 🧳"
          icon={<Luggage size={18} />}
          accent="violet"
          count={companion.packing.length}
          countLabel="غرض · انقري للعرض"
        >
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {companion.packing.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-ink/80 bg-violet-50/40 border border-violet-100 rounded-lg px-3 py-2"
              >
                <span className="text-violet-500 shrink-0">▢</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </CollapsibleCompanionSection>
      )}

      {/* 2. Warnings — bolder, larger, more emphatic so they read as
          safety-critical instead of a list of bullet points. */}
      {companion.warnings && companion.warnings.length > 0 && (
        <CollapsibleCompanionSection
          title="تحذيرات مهمة"
          icon={<AlertTriangle size={18} />}
          accent="red"
          count={companion.warnings.length}
          countLabel="تحذير · انقري للعرض"
        >
          <ul className="space-y-2.5">
            {companion.warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3"
              >
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-red-500 text-white shrink-0 shadow-sm">
                  <AlertTriangle size={15} />
                </span>
                <span className="text-base font-bold text-red-900 leading-relaxed">
                  {w}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleCompanionSection>
      )}

      {/* 3. Day-by-day itinerary */}
      {trip.itinerary && trip.itinerary.length > 0 && (
        <CollapsibleCompanionSection
          title="برنامج الرحلة اليومي"
          icon={<ListChecks size={18} />}
          accent="emerald"
          count={trip.itinerary.length}
          countLabel="يوم · انقري للعرض"
        >
          <div className="space-y-3">
            {trip.itinerary.map((d, i) => {
              // Each itinerary item maps to start_date + i days. We
              // parse start_date as local time (00:00) so getDate() on
              // each addition yields the correct calendar day no matter
              // the visitor's timezone.
              const dateLabel = trip.start_date
                ? (() => {
                    const start = new Date(`${trip.start_date}T00:00:00`);
                    const day = new Date(
                      start.getTime() + i * 86_400_000,
                    );
                    const dd = String(day.getDate()).padStart(2, "0");
                    const mm = String(day.getMonth() + 1).padStart(2, "0");
                    return `${dd}.${mm}.${day.getFullYear()}`;
                  })()
                : null;
              return (
                <div
                  key={i}
                  className="border-r-2 border-coral/30 pr-4 py-2"
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-coral">{d.day}</span>
                    {dateLabel && (
                      <>
                        <span className="text-ink/25">·</span>
                        <span className="text-ink/55 tabular-nums">
                          <bdi>{dateLabel}</bdi>
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-ink mt-0.5">
                    {d.title}
                  </h3>
                  <p className="text-sm text-ink/70 mt-1">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </CollapsibleCompanionSection>
      )}

      {/* 4. Tips */}
      {companion.tips && companion.tips.length > 0 && (
        <CollapsibleCompanionSection
          title="نصائح من SeeYa"
          icon={<Lightbulb size={18} />}
          accent="coral"
          count={companion.tips.length}
          countLabel="نصيحة · انقري للعرض"
        >
          <ul className="space-y-2">
            {companion.tips.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-ink/80"
              >
                <Lightbulb size={14} className="text-coral shrink-0 mt-1" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </CollapsibleCompanionSection>
      )}

      {/* 5. Restaurants */}
      {companion.restaurants && companion.restaurants.length > 0 && (
        <CollapsibleCompanionSection
          title="مطاعم موصى بها"
          icon={<Utensils size={18} />}
          accent="amber"
          count={companion.restaurants.length}
          countLabel="مطعم · انقري للعرض"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companion.restaurants.map((r, i) => (
              <RestaurantCard key={i} item={r} />
            ))}
          </div>
        </CollapsibleCompanionSection>
      )}

      {/* 6. Recommendations */}
      {companion.recommendations && companion.recommendations.length > 0 && (
        <CollapsibleCompanionSection
          title="توصياتنا (أماكن وأنشطة)"
          icon={<Compass size={18} />}
          accent="emerald"
          count={companion.recommendations.length}
          countLabel="توصية · انقري للعرض"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companion.recommendations.map((r, i) => (
              <RecommendationCard key={i} item={r} />
            ))}
          </div>
        </CollapsibleCompanionSection>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────

/**
 * Convert an ISO date string ("2026-06-25") to the locale-friendly
 * day-first format SANDO prefers ("25.06.2026"). Returns the input
 * untouched when it doesn't look like an ISO date — defensive against
 * old values that might already be formatted differently.
 */
function formatIsoDateDDMMYYYY(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function hasFlight(f?: FlightInfo | null): f is FlightInfo {
  if (!f) return false;
  return Boolean(
    f.departure_date ||
      f.departure_time ||
      f.departure_airport ||
      f.airline ||
      f.flight_number ||
      f.notes,
  );
}

/**
 * Merge the per-booking flight override on top of the trip's default
 * flight, field by field. Empty/missing fields in the override fall
 * back to the corresponding default field — so the override behaves
 * like a sparse patch rather than a full replacement.
 *
 * This guarantees every client sees the SAME set of fields on her
 * trip page (airline, time, notes, airport names, ...). Only the
 * values she overrode actually differ from the group default.
 *
 * Returns null when neither side has any useful data.
 */
function mergeFlight(
  override?: FlightInfo | null,
  defaultFlight?: FlightInfo | null,
): FlightInfo | null {
  const pick = <K extends keyof FlightInfo>(key: K) =>
    override?.[key] || defaultFlight?.[key];
  const merged: FlightInfo = {
    departure_date: pick("departure_date"),
    departure_time: pick("departure_time"),
    departure_airport: pick("departure_airport"),
    departure_airport_name: pick("departure_airport_name"),
    arrival_airport: pick("arrival_airport"),
    arrival_airport_name: pick("arrival_airport_name"),
    airline: pick("airline"),
    flight_number: pick("flight_number"),
    duration: pick("duration"),
    notes: pick("notes"),
  };
  return hasFlight(merged) ? merged : null;
}

function OverrideBadge() {
  return (
    <div className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase text-coral bg-coral/10 px-3 py-1.5 rounded-full">
      ✦ طيران خاص بكِ
    </div>
  );
}

function hasHotel(h?: HotelInfo): boolean {
  if (!h) return false;
  return Boolean(h.name || h.address || h.checkin);
}

type Accent = "coral" | "violet" | "amber" | "emerald" | "red";

function CompanionSection({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: Accent;
  children: React.ReactNode;
}) {
  const accentClass: Record<Accent, string> = {
    coral: "bg-coral/10 text-coral",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <section className="bg-white rounded-3xl border border-ink/5 p-6">
      <header className="flex items-center gap-3 mb-4">
        <span
          className={`w-10 h-10 rounded-xl grid place-items-center ${accentClass[accent]}`}
        >
          {icon}
        </span>
        <h2 className="text-xl font-black text-ink">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function FlightCard({ flight }: { flight: FlightInfo }) {
  return (
    <div className="space-y-4">
      {/* Route — TLV → ✈ → HKT, aligned to the visual right within RTL
          page flow. Inner row stays LTR so the airport order reads
          'departure → arrival' the way pilots read it; the outer
          flex `justify-start` pins the whole block to the start of
          the row, which in this RTL context is the visual right. */}
      {(flight.departure_airport || flight.arrival_airport) && (
        <div className="flex justify-start">
          <div
            className="inline-flex items-center gap-3 flex-wrap"
            dir="ltr"
          >
            {flight.departure_airport && (
              <div className="text-center">
                <div className="text-3xl font-black text-ink tabular-nums uppercase tracking-wider">
                  {flight.departure_airport}
                </div>
                {flight.departure_airport_name && (
                  <div className="text-xs text-ink/55">
                    {flight.departure_airport_name}
                  </div>
                )}
              </div>
            )}
            <Plane className="text-coral" size={22} />
            {flight.arrival_airport && (
              <div className="text-center">
                <div className="text-3xl font-black text-ink tabular-nums uppercase tracking-wider">
                  {flight.arrival_airport}
                </div>
                {flight.arrival_airport_name && (
                  <div className="text-xs text-ink/55">
                    {flight.arrival_airport_name}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {flight.departure_date && (
          <Pill
            label="التاريخ"
            value={formatIsoDateDDMMYYYY(flight.departure_date)}
            ltrValue
          />
        )}
        {flight.departure_time && (
          <Pill
            label="الوقت"
            value={flight.departure_time}
            ltrValue
          />
        )}
        {flight.airline && <Pill label="الشركة" value={flight.airline} />}
        {flight.flight_number && (
          <Pill
            label="رقم الرحلة"
            value={flight.flight_number}
            ltrValue
          />
        )}
        {flight.duration && (
          <Pill label="المدة" value={flight.duration} />
        )}
      </div>

      {flight.notes && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-l from-amber-50 to-amber-100/60 shadow-sm">
          <div className="absolute inset-y-0 right-0 w-1.5 bg-amber-400" />
          <div className="flex items-start gap-3 p-4 pr-5">
            <span className="w-9 h-9 rounded-xl bg-amber-400 text-white grid place-items-center shrink-0 shadow-sm">
              <AlertTriangle size={18} />
            </span>
            <div className="space-y-1">
              <div className="text-xs font-black text-amber-700">
                تذكير مهم
              </div>
              <p className="text-sm md:text-base font-bold text-amber-900 leading-relaxed">
                {flight.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HotelCard({ hotel }: { hotel: HotelInfo }) {
  return (
    <div className="space-y-3">
      {hotel.name && (
        <h3 className="text-xl font-black text-ink">{hotel.name}</h3>
      )}
      {hotel.address && (
        <p className="flex items-start gap-1.5 text-sm text-ink/70">
          <MapPin size={14} className="shrink-0 mt-0.5 text-coral" />
          <span>{hotel.address}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {hotel.checkin && (
          <Pill label="Check-in" value={hotel.checkin} ltrValue />
        )}
        {hotel.checkout && (
          <Pill label="Check-out" value={hotel.checkout} ltrValue />
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        {hotel.phone && (
          <a
            href={`tel:${hotel.phone}`}
            dir="ltr"
            className="inline-flex items-center gap-1.5 text-coral hover:underline"
          >
            <Phone size={13} />
            {hotel.phone}
          </a>
        )}
        {hotel.map_url && (
          <a
            href={hotel.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-coral hover:underline"
          >
            <ExternalLink size={13} />
            على الخريطة
          </a>
        )}
      </div>
      {hotel.notes && (
        <p className="text-sm text-ink/70 italic">{hotel.notes}</p>
      )}
    </div>
  );
}

function RestaurantCard({ item }: { item: RestaurantItem }) {
  return (
    <article className="bg-ink/3 border border-ink/5 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="font-black text-ink">{item.name}</h3>
        {item.cuisine && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {item.cuisine}
          </span>
        )}
      </div>
      {item.address && (
        <p className="flex items-start gap-1.5 text-xs text-ink/60 mt-1.5">
          <MapPin size={11} className="shrink-0 mt-0.5" />
          <span>{item.address}</span>
        </p>
      )}
      {item.note && (
        <p className="text-xs text-ink/70 mt-2 italic">&ldquo;{item.note}&rdquo;</p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-coral hover:underline mt-2"
        >
          <ExternalLink size={10} />
          المزيد
        </a>
      )}
    </article>
  );
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  return (
    <article className="bg-ink/3 border border-ink/5 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="font-black text-ink">{item.title}</h3>
        {item.category && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
        )}
      </div>
      {item.description && (
        <p className="text-sm text-ink/70 mt-1.5">{item.description}</p>
      )}
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-coral hover:underline mt-2"
        >
          <ExternalLink size={10} />
          المزيد
        </a>
      )}
    </article>
  );
}

function Pill({
  label,
  value,
  ltrValue,
}: {
  label: string;
  value: string;
  ltrValue?: boolean;
}) {
  return (
    <div className="bg-ink/3 rounded-xl px-3 py-2 text-right">
      <div className="text-xs font-semibold text-ink/55">{label}</div>
      <div className="font-bold text-ink mt-0.5 tabular-nums">
        {ltrValue ? <bdi>{value}</bdi> : value}
      </div>
    </div>
  );
}

