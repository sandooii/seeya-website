import Link from "next/link";
import Image from "next/image";
import { Plus, Edit3 } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripRow, TripStatusDB, CurrencyCode } from "@/lib/supabase/types";
import DeleteTripButton from "./DeleteTripButton";

export const metadata = { title: "الرحلات — Admin" };

const statusLabel: Record<TripStatusDB, string> = {
  live: "مباشر الآن",
  open: "مفتوح",
  soon: "قريباً",
  completed: "انتهت",
  "sold-out": "مكتمل",
};

const statusColor: Record<TripStatusDB, string> = {
  live: "bg-emerald-100 text-emerald-700 border-emerald-200",
  open: "bg-coral/10 text-coral border-coral/20",
  soon: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-ink/10 text-ink/70 border-ink/15",
  "sold-out": "bg-ink/90 text-white border-ink",
};

function formatPrice(price: number, currency: CurrencyCode | null): string {
  if (price <= 0) return "—";
  const num = price.toLocaleString("en-US");
  // Currency symbol always trails the number — mirrors formatBookingPrice
  // so the admin and account screens look the same.
  return currency === "USD" ? `${num} $` : `${num} ₪`;
}

export default async function TripsAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        <h2 className="font-bold mb-2">خطأ في تحميل الرحلات</h2>
        <pre className="text-xs">{error.message}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-ink">
            إدارة الرحلات
          </h1>
          <p className="text-ink/60 mt-2">
            {(trips ?? []).length} رحلات مسجّلة
          </p>
        </div>
        <Link
          href="/admin/trips/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          <span>رحلة جديدة</span>
        </Link>
      </header>

      <div className="bg-white rounded-3xl border border-ink/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-ink/3 border-b border-ink/8">
              <tr className="text-ink/60 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">الرحلة</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">الشهر</th>
                <th className="px-4 py-3 font-bold">المحجوزة</th>
                <th className="px-4 py-3 font-bold">السعر</th>
                <th className="px-4 py-3 font-bold text-center w-32">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {(trips ?? []).map((trip: TripRow) => (
                <tr key={trip.id} className="hover:bg-ink/2 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-ink/5 shrink-0">
                        <Image
                          src={trip.image_url}
                          alt={trip.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-ink truncate">
                          {trip.name}
                        </div>
                        <div
                          className="text-xs text-ink/50 tabular-nums"
                          dir="ltr"
                        >
                          {trip.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor[trip.status]}`}
                    >
                      {statusLabel[trip.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/80 text-sm">{trip.month}</td>
                  <td className="px-4 py-3 text-ink/80 tabular-nums">
                    {(() => {
                      const total = trip.total_spots ?? 0;
                      const available = trip.available_spots ?? 0;
                      const booked = Math.max(0, total - available);
                      const full = total > 0 && available === 0;
                      return (
                        <span
                          className={`font-semibold ${
                            full ? "text-emerald-700" : "text-ink/80"
                          }`}
                          dir="ltr"
                        >
                          {booked} / {total}
                        </span>
                      );
                    })()}
                  </td>
                  <td
                    className="px-4 py-3 font-bold text-ink tabular-nums"
                    dir="ltr"
                  >
                    {formatPrice(trip.price, trip.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/admin/trips/${trip.id}`}
                        aria-label="تعديل"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink/60 hover:bg-coral/10 hover:text-coral transition-colors"
                      >
                        <Edit3 size={16} />
                      </Link>
                      <DeleteTripButton tripId={trip.id} tripName={trip.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {(trips ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-ink/40"
                  >
                    لا توجد رحلات بعد. أضيفي أول رحلة!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
