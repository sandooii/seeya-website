import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Plane,
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { BookingStatus, CurrencyCode } from "@/lib/supabase/types";

type BookingStatsRow = {
  status: BookingStatus;
  total_amount: number;
  paid_amount: number;
  currency: CurrencyCode;
};

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch quick counts in parallel
  const [
    { count: tripsCount },
    { count: bookingsCount },
    { count: clientsCount },
    { count: waitlistCount },
    bookingsResult,
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
      .select("status, total_amount, paid_amount, currency"),
  ]);

  const bookings = (bookingsResult.data ?? []) as BookingStatsRow[];

  // Aggregate booking-derived stats
  let pendingDeposits = 0;
  let revenueUSD = 0;
  let revenueILS = 0;
  for (const b of bookings) {
    if (b.status === "pending_deposit") pendingDeposits++;
    if (b.status !== "cancelled") {
      if (b.currency === "USD") revenueUSD += Number(b.paid_amount);
      else revenueILS += Number(b.paid_amount);
    }
  }

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
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          مرحبا بكِ في لوحة الإدارة
        </h1>
        <p className="text-ink/60 mt-2 text-lg">نظرة سريعة على المنصة</p>
      </header>

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
                <span className="text-ink/30 text-sm group-hover:text-coral transition-colors">
                  →
                </span>
              </div>
              <div className="text-3xl font-black text-ink tabular-nums">
                {stat.value}
              </div>
              <div className="text-sm text-ink/60 mt-1">{stat.label}</div>
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
          <div className="flex items-end gap-3">
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
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            {revenueUSD > 0 && (
              <div
                className="text-3xl font-black text-emerald-600 tabular-nums"
                dir="ltr"
              >
                ${revenueUSD.toLocaleString("en-US")}
              </div>
            )}
            {revenueILS > 0 && (
              <div
                className="text-2xl font-black text-emerald-600/80 tabular-nums"
                dir="ltr"
              >
                {revenueILS.toLocaleString("en-US")} ₪
              </div>
            )}
            {revenueUSD === 0 && revenueILS === 0 && (
              <div className="text-ink/30 text-sm">— لا يوجد بعد —</div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 border border-ink/5">
        <h2 className="text-2xl font-black text-ink mb-4">ما اللي خلص</h2>
        <ul className="space-y-3 text-ink/75">
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>إعداد قاعدة البيانات وربط Supabase</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>إدارة الرحلات + رفع PDF برنامج الرحلة</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>إدارة الحجوزات والمدفوعات + خصم تلقائي للمقاعد</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>إدارة قائمة الانتظار + تحويل لحجز بنقرة</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>
              حسابات للعميلات + تسجيل دخول برقم التلفون (بدون OTP)
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>
              "دليل الرحلة" — معلومات الطيران، الفندق، التحذيرات، المطاعم،
              نصائح
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>ربط حجز يدوي بحساب عميلة بزر واحد</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>فورم قائمة انتظار مباشر على الموقع</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>تحسينات تجربة الموبايل (sidebar منزلق)</span>
          </li>
        </ul>
        <h2 className="text-2xl font-black text-ink mt-8 mb-4">
          الخطوات الجاية
        </h2>
        <ul className="space-y-3 text-ink/75">
          <li className="flex gap-3 text-ink/55">
            <span>○</span>
            <span>تذكيرات أوتوماتيكية (دفع، طيران، تجهيز السفر)</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
