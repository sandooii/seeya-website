import Link from "next/link";
import Image from "next/image";
import { Plus, Edit3, Search, Phone, Mail, ArrowUpRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WaitlistStatus } from "@/lib/supabase/types";
import {
  isWaitlistOpen,
  waitlistStatusColor,
  waitlistStatusLabel,
  type WaitlistWithTrip,
} from "@/lib/waitlist";
import DeleteWaitlistButton from "./DeleteWaitlistButton";
import ConvertWaitlistButton from "./ConvertWaitlistButton";

export const metadata = { title: "قائمة الانتظار — Admin" };

const STATUSES: WaitlistStatus[] = [
  "waiting",
  "offered",
  "converted",
  "declined",
  "cancelled",
];

type SearchParams = {
  q?: string;
  trip?: string;
  status?: WaitlistStatus;
};

export default async function WaitlistAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const tripFilter = params.trip ?? "";
  const statusFilter: WaitlistStatus | "" = params.status ?? "";

  const supabase = await createServerSupabaseClient();

  const { data: tripsForFilter } = await supabase
    .from("trips")
    .select("id, slug, name, status")
    .order("sort_order", { ascending: true });

  let query = supabase
    .from("waitlist")
    .select(
      `
      *,
      trip:trips(id, slug, name, country, image_url, month, status)
    `,
    )
    .order("created_at", { ascending: false });

  if (tripFilter) query = query.eq("trip_id", tripFilter);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`,
    );
  }

  const { data: list, error } = await query;

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        <h2 className="font-bold mb-2">خطأ في تحميل قائمة الانتظار</h2>
        <pre className="text-xs whitespace-pre-wrap">{error.message}</pre>
      </div>
    );
  }

  const entries = (list ?? []) as WaitlistWithTrip[];

  // Stats — across ALL entries (ignore filters)
  const { data: allForStats } = await supabase.from("waitlist").select("status");
  const stats = computeStats(allForStats ?? []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-ink">
            قائمة الانتظار
          </h1>
          <p className="text-ink/60 mt-2">
            {entries.length} إدخال معروض من أصل {stats.total}
          </p>
        </div>
        <Link
          href="/admin/waitlist/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          <span>إضافة لقائمة الانتظار</span>
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="بانتظار" value={stats.waiting} accent="amber" />
        <StatCard label="عُرض عليها" value={stats.offered} accent="violet" />
        <StatCard
          label="تحوّلت لحجز"
          value={stats.converted}
          accent="emerald"
        />
        <StatCard
          label="ملغاة / رُفضت"
          value={stats.declined + stats.cancelled}
        />
      </div>

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
              {waitlistStatusLabel[s]}
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
            href="/admin/waitlist"
            className="px-4 py-2.5 rounded-xl border border-ink/10 text-ink/60 text-sm font-bold hover:bg-ink/5 transition-colors"
          >
            مسح الفلاتر
          </Link>
        )}
      </form>

      <div className="bg-white rounded-3xl border border-ink/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-ink/3 border-b border-ink/8">
              <tr className="text-ink/60 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">المسافرة</th>
                <th className="px-4 py-3 font-bold">الرحلة</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">التاريخ</th>
                <th className="px-4 py-3 font-bold text-center min-w-[180px]">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {entries.map((e) => {
                const canConvert =
                  isWaitlistOpen(e.status) && !!e.trip;
                return (
                  <tr key={e.id} className="hover:bg-ink/2 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-ink">{e.full_name}</div>
                      <a
                        href={`https://wa.me/${e.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-coral mt-0.5"
                      >
                        <Phone size={11} />
                        {e.phone}
                      </a>
                      {e.email && (
                        <a
                          href={`mailto:${e.email}`}
                          dir="ltr"
                          className="flex items-center gap-1 text-xs text-ink/50 hover:text-coral mt-0.5"
                        >
                          <Mail size={11} />
                          {e.email}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {e.trip ? (
                        <div className="flex items-center gap-2">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-ink/5 shrink-0">
                            <Image
                              src={e.trip.image_url}
                              alt={e.trip.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink text-sm truncate">
                              {e.trip.name}
                            </div>
                            <div className="text-xs text-ink/50">
                              {e.trip.month}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-ink/40 text-sm">رحلة محذوفة</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${waitlistStatusColor[e.status]}`}
                        >
                          {waitlistStatusLabel[e.status]}
                        </span>
                        {e.converted_to_booking_id && (
                          <Link
                            href={`/admin/bookings/${e.converted_to_booking_id}`}
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                          >
                            <ArrowUpRight size={11} />
                            عرض الحجز
                          </Link>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs text-ink/60 align-top tabular-nums"
                      dir="ltr"
                    >
                      {formatDate(e.created_at)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {canConvert && (
                          <ConvertWaitlistButton
                            entryId={e.id}
                            fullName={e.full_name}
                          />
                        )}
                        <Link
                          href={`/admin/waitlist/${e.id}`}
                          aria-label="تعديل"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink/60 hover:bg-coral/10 hover:text-coral transition-colors"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <DeleteWaitlistButton
                          entryId={e.id}
                          fullName={e.full_name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-ink/40"
                  >
                    {q || tripFilter || statusFilter
                      ? "ما في إدخالات تطابق الفلاتر."
                      : "قائمة الانتظار فاضية. أضيفي أول إدخال!"}
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
  value: number;
  accent?: "amber" | "emerald" | "violet";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "emerald"
        ? "text-emerald-600"
        : accent === "violet"
          ? "text-violet-600"
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

function computeStats(rows: { status: WaitlistStatus }[]) {
  let waiting = 0,
    offered = 0,
    converted = 0,
    declined = 0,
    cancelled = 0;
  for (const r of rows) {
    if (r.status === "waiting") waiting++;
    else if (r.status === "offered") offered++;
    else if (r.status === "converted") converted++;
    else if (r.status === "declined") declined++;
    else if (r.status === "cancelled") cancelled++;
  }
  return {
    total: rows.length,
    waiting,
    offered,
    converted,
    declined,
    cancelled,
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
