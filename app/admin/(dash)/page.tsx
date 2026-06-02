import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Plane,
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { BookingStatus, CurrencyCode } from "@/lib/supabase/types";
import TodaysActions from "./TodaysActions";

type BookingStatsRow = {
  status: BookingStatus;
  total_amount: number;
  paid_amount: number;
  currency: CurrencyCode;
  created_at: string;
};

type RecentBookingRow = {
  id: string;
  client_name: string | null;
  status: BookingStatus;
  paid_amount: number;
  total_amount: number;
  currency: CurrencyCode;
  created_at: string;
  updated_at: string;
  trip: { name: string } | null;
};

type RecentWaitlistRow = {
  id: string;
  full_name: string;
  created_at: string;
  trip: { name: string } | null;
};

/** Format an ISO date as "منذ X يوم" / "اليوم" / "أمس". */
function relativeArabic(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const days = Math.floor((now - then) / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 14) return "منذ أسبوع";
  return `منذ ${Math.floor(days / 7)} أسابيع`;
}

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // 7-day window for "recent activity". Server components run once per
  // request, so reading `Date.now()` here is intentional (it's "now"
  // from the server's perspective) — the React purity lint flags it
  // because it can't distinguish server-render from re-render.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  const fiveDaysAgoMs = nowMs - 5 * 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(sevenDaysAgoMs).toISOString();

  // Fetch quick counts in parallel
  const [
    { count: tripsCount },
    { count: bookingsCount },
    { count: clientsCount },
    { count: waitlistCount },
    bookingsResult,
    recentBookingsResult,
    recentWaitlistResult,
  ] = await Promise.all([
    supabase.from("trips").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "client"),
    supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .eq("status", "waiting"),
    supabase
      .from("bookings")
      .select("status, total_amount, paid_amount, currency, created_at"),
    supabase
      .from("bookings")
      .select(
        "id, client_name, status, paid_amount, total_amount, currency, created_at, updated_at, trip:trips(name)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("waitlist")
      .select("id, full_name, created_at, trip:trips(name)")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const bookings = (bookingsResult.data ?? []) as BookingStatsRow[];
  const recentBookings = (recentBookingsResult.data ??
    []) as unknown as RecentBookingRow[];
  const recentWaitlist = (recentWaitlistResult.data ??
    []) as unknown as RecentWaitlistRow[];

  // Aggregate booking-derived stats
  let pendingDeposits = 0;
  let revenueUSD = 0;
  let revenueILS = 0;
  // Last-7-days slice
  let newBookingsCount7d = 0;
  let revenueILS7d = 0;
  let revenueUSD7d = 0;
  // "Needs follow-up": deposit_paid + still has balance + created > 5 days ago
  let needsFollowUp = 0;

  for (const b of bookings) {
    const createdMs = new Date(b.created_at).getTime();
    const isWithin7d = createdMs >= sevenDaysAgoMs;

    if (b.status === "pending_deposit") pendingDeposits++;
    if (b.status !== "cancelled") {
      if (b.currency === "USD") revenueUSD += Number(b.paid_amount);
      else revenueILS += Number(b.paid_amount);
      if (isWithin7d) {
        newBookingsCount7d++;
        if (b.currency === "USD") revenueUSD7d += Number(b.paid_amount);
        else revenueILS7d += Number(b.paid_amount);
      }
    }
    // Stale partial payments
    if (
      b.status === "deposit_paid" &&
      Number(b.paid_amount) < Number(b.total_amount) &&
      createdMs < fiveDaysAgoMs
    ) {
      needsFollowUp++;
    }
  }

  const newWaitlist7d = recentWaitlist.length;

  const stats = [
    {
      label: "الرحلات",
      value: tripsCount ?? 0,
      href: "/admin/trips",
      icon: Plane,
      color: "#F95C6B",
    },
    {
      label: "الحجوزات",
      value: bookingsCount ?? 0,
      href: "/admin/bookings",
      icon: BookOpen,
      color: "#7c3aed",
    },
    {
      label: "العميلات",
      value: clientsCount ?? 0,
      href: "/admin/clients",
      icon: Users,
      color: "#059669",
    },
    {
      label: "قائمة الانتظار",
      value: waitlistCount ?? 0,
      href: "/admin/waitlist",
      icon: Clock,
      color: "#d97706",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-3xl md:text-5xl font-black text-ink">
          مرحبا بكِ في لوحة الإدارة
        </h1>
        <p className="text-ink/60 mt-2 text-base md:text-lg">نظرة سريعة على المنصة</p>
      </header>

      {/* CRM #3: actionable to-do list shown above the stats */}
      <TodaysActions />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-3xl bg-white p-6 border border-ink/5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-2xl grid place-items-center"
                  style={{
                    backgroundColor: `${stat.color}15`,
                    color: stat.color,
                  }}
                >
                  <Icon size={20} />
                </div>
                <ArrowLeft
                  size={14}
                  className="text-ink/30 group-hover:text-coral transition-colors"
                />
              </div>
              <div className="text-3xl font-black text-ink tabular-nums text-right">
                {stat.value}
              </div>
              <div className="text-sm text-ink/60 mt-1 text-right">
                {stat.label}
              </div>
            </Link>
          );
        })}
      </section>

      {/* Bookings highlights */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white p-6 border border-ink/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 grid place-items-center">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-bold text-ink">يحتاج متابعة</h3>
          </div>
          <p className="text-ink/60 text-sm mb-3">
            حجوزات بانتظار تأكيد المقدّم
          </p>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div className="text-4xl font-black text-amber-600 tabular-nums">
              {pendingDeposits}
            </div>
            {pendingDeposits > 0 && (
              <Link
                href="/admin/bookings?status=pending_deposit"
                className="text-sm font-bold text-coral hover:underline mb-2"
              >
                عرض كل المعلّقة ←
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 border border-ink/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 grid place-items-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-bold text-ink">إجمالي ما تم تحصيله</h3>
          </div>
          <p className="text-ink/60 text-sm mb-3">
            من كل الحجوزات (غير الملغية)
          </p>
          <div className="flex flex-wrap items-end justify-start gap-x-4 gap-y-1">
            {revenueUSD > 0 && (
              <bdi className="text-3xl font-black text-emerald-600 tabular-nums">
                {revenueUSD.toLocaleString("en-US")} $
              </bdi>
            )}
            {revenueILS > 0 && (
              <bdi className="text-2xl font-black text-emerald-600/80 tabular-nums">
                {revenueILS.toLocaleString("en-US")} ₪
              </bdi>
            )}
            {revenueUSD === 0 && revenueILS === 0 && (
              <div className="text-ink/30 text-sm">— لا يوجد بعد —</div>
            )}
          </div>
        </div>
      </section>

      {/* ─── نشاط آخر 7 أيام ─── */}
      <section className="rounded-3xl bg-white p-6 md:p-8 border border-ink/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-coral/10 text-coral grid place-items-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-ink">
              نشاط آخر 7 أيام
            </h2>
            <p className="text-ink/55 text-xs md:text-sm">
              ملخّص سريع على شو صار وشو لازم تتابعيه
            </p>
          </div>
        </div>

        {/* 4 mini-stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MiniStat
            label="حجوزات جديدة"
            value={newBookingsCount7d.toString()}
            tone="violet"
          />
          <MiniStat
            label="تم تحصيله"
            value={
              revenueILS7d > 0 || revenueUSD7d > 0
                ? [
                    revenueILS7d > 0
                      ? `${revenueILS7d.toLocaleString("en-US")} ₪`
                      : null,
                    revenueUSD7d > 0
                      ? `${revenueUSD7d.toLocaleString("en-US")} $`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" + ")
                : "—"
            }
            tone="emerald"
          />
          <MiniStat
            label="قائمة انتظار جديدة"
            value={newWaitlist7d.toString()}
            tone="amber"
          />
          <MiniStat
            label="بحاجة متابعة"
            value={needsFollowUp.toString()}
            tone="coral"
            href={
              needsFollowUp > 0 ? "/admin/bookings?status=deposit_paid" : undefined
            }
            hint={needsFollowUp > 0 ? "حجوزات مدفوعة جزئياً > 5 أيام" : undefined}
          />
        </div>

        {/* Two-column activity feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-ink/8">
          {/* Latest bookings */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink text-sm">
                آخر الحجوزات
              </h3>
              <Link
                href="/admin/bookings"
                className="text-xs font-bold text-coral hover:underline inline-flex items-center gap-1"
              >
                الكل
                <ArrowLeft size={12} />
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <p className="text-ink/40 text-sm">— لا توجد حجوزات بعد —</p>
            ) : (
              <ul className="space-y-2">
                {recentBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 text-sm py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink truncate">
                        {b.client_name || "حجز يدوي"}
                      </div>
                      <div className="text-ink/50 text-xs truncate">
                        {b.trip?.name ?? "رحلة محذوفة"} ·{" "}
                        {relativeArabic(b.created_at)}
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold text-emerald-600 tabular-nums shrink-0"
                      dir="ltr"
                    >
                      {Number(b.paid_amount).toLocaleString("en-US")}{" "}
                      {b.currency === "USD" ? "$" : "₪"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Latest waitlist */}
          <div className="pt-5 md:border-r md:border-ink/8 md:pr-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink text-sm">
                آخر طلبات قائمة الانتظار
              </h3>
              <Link
                href="/admin/waitlist"
                className="text-xs font-bold text-coral hover:underline inline-flex items-center gap-1"
              >
                الكل
                <ArrowLeft size={12} />
              </Link>
            </div>
            {recentWaitlist.length === 0 ? (
              <p className="text-ink/40 text-sm">— لا توجد طلبات هذا الأسبوع —</p>
            ) : (
              <ul className="space-y-2">
                {recentWaitlist.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-3 text-sm py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink truncate">
                        {w.full_name}
                      </div>
                      <div className="text-ink/50 text-xs truncate">
                        {w.trip?.name ?? "رحلة محذوفة"} ·{" "}
                        {relativeArabic(w.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Mini-stat sub-component for the activity card ───

type MiniStatTone = "coral" | "emerald" | "amber" | "violet";

function MiniStat({
  label,
  value,
  tone,
  href,
  hint,
}: {
  label: string;
  value: string;
  tone: MiniStatTone;
  href?: string;
  hint?: string;
}) {
  const toneClasses: Record<MiniStatTone, string> = {
    coral: "bg-coral/8 text-coral",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  const content = (
    <div
      className={`rounded-2xl p-4 text-right ${toneClasses[tone]} ${href ? "hover:brightness-95 transition-all" : ""}`}
    >
      <div className="text-xs font-semibold opacity-80">{label}</div>
      <div className="text-2xl md:text-3xl font-black tabular-nums mt-1">
        <bdi>{value}</bdi>
      </div>
      {hint && (
        <div className="text-[10px] opacity-70 mt-1">{hint}</div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
