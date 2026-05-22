import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plane, BookOpen, Users, Clock } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch quick counts in parallel
  const [{ count: tripsCount }, { count: bookingsCount }, { count: clientsCount }, { count: waitlistCount }] =
    await Promise.all([
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
    ]);

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
        <p className="text-ink/60 mt-2 text-lg">
          نظرة سريعة على المنصة
        </p>
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

      <section className="rounded-3xl bg-white p-8 border border-ink/5">
        <h2 className="text-2xl font-black text-ink mb-4">الخطوات التالية</h2>
        <ul className="space-y-3 text-ink/75">
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>تم إعداد قاعدة البيانات وربط Supabase</span>
          </li>
          <li className="flex gap-3">
            <span className="text-coral font-bold">✓</span>
            <span>تم إنشاء حسابك كأدمن</span>
          </li>
          <li className="flex gap-3 text-ink/40">
            <span>○</span>
            <span>قريباً: إضافة وتعديل الرحلات من اللوحة</span>
          </li>
          <li className="flex gap-3 text-ink/40">
            <span>○</span>
            <span>قريباً: إدارة الحجوزات والمدفوعات</span>
          </li>
          <li className="flex gap-3 text-ink/40">
            <span>○</span>
            <span>قريباً: رفع وإدارة الـ PDFs</span>
          </li>
          <li className="flex gap-3 text-ink/40">
            <span>○</span>
            <span>قريباً: نظام التذكيرات الأوتوماتيكية</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
