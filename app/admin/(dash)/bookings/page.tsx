import Link from "next/link";
import Image from "next/image";
import { Plus, Edit3, Search, Phone, Mail } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/lib/supabase/types";
import {
  bookingClientEmail,
  bookingClientName,
  bookingClientPhone,
  bookingStatusColor,
  bookingStatusLabel,
  formatBookingPrice,
  paymentProgress,
  remainingAmount,
  type BookingWithTrip,
} from "@/lib/bookings";
import { buildIlikeOrFilter } from "@/lib/search";
import DeleteBookingButton from "./DeleteBookingButton";

export const metadata = { title: "الحجوزات — Admin" };

const STATUSES: BookingStatus[] = [
  "pending_deposit",
  "deposit_paid",
  "paid_full",
  "cancelled",
];

type SearchParams = {
  q?: string;
  trip?: string;
  status?: BookingStatus;
};

export default async function BookingsAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tripFilter = params.trip ?? "";
  const statusFilter: BookingStatus | "" = params.status ?? "";

  const supabase = await createServerSupabaseClient();

  // Fetch all trips for the filter dropdown
  const { data: tripsForFilter } = await supabase
    .from("trips")
    .select("id, slug, name, status")
    .order("sort_order", { ascending: true });

  // Build the bookings query with joins
  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      trip:trips(id, slug, name, country, image_url, month, status),
      client_profile:profiles(id, full_name, phone, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (tripFilter) query = query.eq("trip_id", tripFilter);
  if (statusFilter) query = query.eq("status", statusFilter);
  // Match across inline client fields. Sanitized to drop reserved
  // PostgREST chars (commas, parens) and LIKE wildcards.
  const searchFilter = buildIlikeOrFilter(q, [
    "client_name",
    "client_phone",
    "client_email",
  ]);
  if (searchFilter) query = query.or(searchFilter);

  const { data: bookings, error } = await query;

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        <h2 className="font-bold mb-2">خطأ في تحميل الحجوزات</h2>
        <pre className="text-xs whitespace-pre-wrap">{error.message}</pre>
      </div>
    );
  }

  const list = (bookings ?? []) as BookingWithTrip[];

  // Compute stats — across ALL bookings (ignore current filters)
  const { data: allForStats } = await supabase
    .from("bookings")
    .select("status, total_amount, paid_amount, currency");
  const stats = computeStats(allForStats ?? []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-ink">
            إدارة الحجوزات
          </h1>
          <p className="text-ink/60 mt-2">
            {list.length} حجز معروض من أصل {stats.total}
          </p>
        </div>
        <Link
          href="/admin/bookings/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          <span>حجز جديد</span>
        </Link>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="إجمالي الحجوزات" value={stats.total.toString()} />
        <StatCard
          label="بانتظار المقدّم"
          value={stats.pending.toString()}
          accent="amber"
        />
        <StatCard
          label="مؤكدة (دفعت/كاملة)"
          value={(stats.depositPaid + stats.paidFull).toString()}
          accent="emerald"
        />
        <StatCard
          label="إيرادات (USD)"
          value={`$${stats.revenueUSD.toLocaleString("en-US")}`}
          accent="coral"
        />
      </div>

      {/* Filters */}
      <form
        method="get"
        className="bg-white rounded-2xl border border-ink/5 p-4 flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="بحث بالاسم، الرقم، أو الإيميل…"
            className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-ink/10 bg-cream/40 text-sm focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/40"
          />
        </div>

        <select
          name="trip"
          defaultValue={tripFilter}
          className="px-3 py-2.5 rounded-xl border border-ink/10 bg-cream/40 text-sm focus:outline-none focus:ring-2 focus:ring-coral/30"
        >
          <option value="">كل الرحلات</option>
          {(tripsForFilter ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={statusFilter}
          className="px-3 py-2.5 rounded-xl border border-ink/10 bg-cream/40 text-sm focus:outline-none focus:ring-2 focus:ring-coral/30"
        >
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {bookingStatusLabel[s]}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-ink text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          تطبيق
        </button>

        {(q || tripFilter || statusFilter) && (
          <Link
            href="/admin/bookings"
            className="px-4 py-2.5 rounded-xl border border-ink/10 text-ink/60 text-sm font-bold hover:bg-ink/5 transition-colors"
          >
            مسح الفلاتر
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-ink/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-ink/3 border-b border-ink/8">
              <tr className="text-ink/60 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">العميلة</th>
                <th className="px-4 py-3 font-bold">الرحلة</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">الدفع</th>
                <th className="px-4 py-3 font-bold">التاريخ</th>
                <th className="px-4 py-3 font-bold text-center w-32">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {list.map((b) => {
                const name = bookingClientName(b);
                const phone = bookingClientPhone(b);
                const email = bookingClientEmail(b);
                const pct = paymentProgress(b);
                const remaining = remainingAmount(b);

                return (
                  <tr key={b.id} className="hover:bg-ink/2 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-ink">{name}</div>
                      {phone && (
                        <a
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-coral mt-0.5"
                        >
                          <Phone size={11} />
                          {phone}
                        </a>
                      )}
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          dir="ltr"
                          className="flex items-center gap-1 text-xs text-ink/50 hover:text-coral mt-0.5"
                        >
                          <Mail size={11} />
                          {email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {b.trip ? (
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-ink/5 shrink-0">
                            <Image
                              src={b.trip.image_url}
                              alt={b.trip.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink text-sm truncate">
                              {b.trip.name}
                            </div>
                            <div className="text-xs text-ink/50">
                              {b.trip.month}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-ink/40 text-sm">رحلة محذوفة</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${bookingStatusColor[b.status]}`}
                      >
                        {bookingStatusLabel[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top min-w-[140px]">
                      <div
                        className="text-sm font-bold text-ink tabular-nums"
                        dir="ltr"
                      >
                        {formatBookingPrice(b.paid_amount, b.currency)}
                        <span className="text-ink/40 font-normal">
                          {" / "}
                          {formatBookingPrice(b.total_amount, b.currency)}
                        </span>
                      </div>
                      <div className="h-1.5 mt-1.5 rounded-full bg-ink/8 overflow-hidden">
                        <div
                          className="h-full bg-coral rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {remaining > 0 && b.status !== "cancelled" && (
                        <div
                          className="text-[10px] text-ink/50 mt-0.5 tabular-nums"
                          dir="ltr"
                        >
                          متبقي {formatBookingPrice(remaining, b.currency)}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-xs text-ink/60 align-top tabular-nums"
                      dir="ltr"
                    >
                      {formatDate(b.created_at)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          aria-label="تعديل"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink/60 hover:bg-coral/10 hover:text-coral transition-colors"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <DeleteBookingButton
                          bookingId={b.id}
                          clientName={name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-ink/40"
                  >
                    {q || tripFilter || statusFilter
                      ? "ما في حجوزات تطابق الفلاتر."
                      : "لا توجد حجوزات بعد. أضيفي أول حجز!"}
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "amber" | "emerald" | "coral";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "emerald"
        ? "text-emerald-600"
        : accent === "coral"
          ? "text-coral"
          : "text-ink";
  return (
    <div className="rounded-2xl bg-white border border-ink/5 p-4">
      <div className="text-xs text-ink/50 font-semibold uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-2xl md:text-3xl font-black mt-1 tabular-nums ${accentClass}`}
      >
        {value}
      </div>
    </div>
  );
}

type StatsRow = Pick<
  BookingWithTrip,
  "status" | "total_amount" | "paid_amount" | "currency"
>;

function computeStats(rows: StatsRow[]) {
  let pending = 0;
  let depositPaid = 0;
  let paidFull = 0;
  let cancelled = 0;
  let revenueUSD = 0;
  let revenueILS = 0;

  for (const r of rows) {
    if (r.status === "pending_deposit") pending++;
    else if (r.status === "deposit_paid") depositPaid++;
    else if (r.status === "paid_full") paidFull++;
    else if (r.status === "cancelled") cancelled++;

    if (r.status !== "cancelled") {
      if (r.currency === "USD") revenueUSD += Number(r.paid_amount);
      else revenueILS += Number(r.paid_amount);
    }
  }

  return {
    total: rows.length,
    pending,
    depositPaid,
    paidFull,
    cancelled,
    revenueUSD,
    revenueILS,
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

