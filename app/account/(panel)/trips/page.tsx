import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Download } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingRow, TripRow } from "@/lib/supabase/types";
import {
  bookingStatusColor,
  bookingStatusLabel,
  formatBookingPrice,
  paymentProgress,
  remainingAmount,
} from "@/lib/bookings";
import { getTripPdfUrl } from "@/lib/pdfs";

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
  > | null;
};

export default async function MyTripsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      trip:trips(id, slug, name, country, image_url, month, duration, start_date, pdf_path, updated_at)
    `,
    )
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        خطأ في تحميل الرحلات: {error.message}
      </div>
    );
  }

  const bookings = (data ?? []) as BookingWithTrip[];

  return (
    <div className="space-y-6" dir="rtl">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-ink">رحلاتي</h1>
        <p className="text-ink/60 mt-2">
          {bookings.length === 0
            ? "ما عندك حجوزات بعد"
            : `${bookings.length} ${bookings.length === 1 ? "رحلة" : "رحلات"}`}
        </p>
      </header>

      {bookings.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-ink/15 p-12 text-center">
          <p className="text-ink/55 mb-4">
            لما تحجزي رحلة معنا، رح تظهر هون مع كل تفاصيلها
          </p>
          <Link
            href="/#trips"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral text-white text-sm font-bold hover:brightness-110"
          >
            تصفحي الرحلات
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((b) => {
          const pct = paymentProgress(b);
          const remaining = remainingAmount(b);
          const pdfUrl = b.trip
            ? getTripPdfUrl(b.trip.pdf_path, b.trip.updated_at)
            : null;
          return (
            <article
              key={b.id}
              className="bg-white rounded-3xl border border-ink/5 overflow-hidden flex flex-col md:flex-row"
            >
              {b.trip && (
                <div className="relative md:w-72 aspect-[16/9] md:aspect-auto shrink-0">
                  <Image
                    src={b.trip.image_url}
                    alt={b.trip.name}
                    fill
                    sizes="(min-width: 768px) 288px, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 p-5 md:p-6 flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-xl md:text-2xl font-black text-ink">
                      {b.trip?.name ?? "رحلة محذوفة"}
                    </h2>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${bookingStatusColor[b.status]}`}
                    >
                      {bookingStatusLabel[b.status]}
                    </span>
                  </div>
                  {b.trip && (
                    <div className="flex items-center gap-3 text-xs text-ink/60">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {b.trip.month}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {b.trip.duration}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-ink/55 font-semibold">
                      {pct >= 100
                        ? "دفعت بالكامل ✓"
                        : `${formatBookingPrice(b.paid_amount, b.currency)} / ${formatBookingPrice(b.total_amount, b.currency)}`}
                    </span>
                    <span className="text-ink/40 tabular-nums" dir="ltr">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-coral"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {remaining > 0 && b.status !== "cancelled" && (
                    <p
                      className="text-xs text-ink/50 mt-1 tabular-nums"
                      dir="ltr"
                    >
                      متبقي {formatBookingPrice(remaining, b.currency)}
                    </p>
                  )}
                </div>

                {pdfUrl && (
                  <div className="mt-1">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-coral/8 text-coral text-xs font-bold hover:bg-coral/15 transition-colors"
                    >
                      <Download size={13} />
                      تنزيل برنامج الرحلة PDF
                    </a>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
