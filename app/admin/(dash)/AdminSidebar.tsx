"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  BookOpen,
  Users,
  Clock,
  FileText,
  LogOut,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/trips", label: "الرحلات", icon: Plane },
  { href: "/admin/bookings", label: "الحجوزات", icon: BookOpen },
  { href: "/admin/clients", label: "العميلات", icon: Users },
  { href: "/admin/waitlist", label: "قائمة الانتظار", icon: Clock },
  { href: "/admin/pdfs", label: "الملفات", icon: FileText },
];

export default function AdminSidebar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 shrink-0 sticky top-0 h-screen flex flex-col"
      style={{
        backgroundColor: "white",
        borderInlineStart: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-5">
        <Link href="/admin" className="block">
          <div className="text-2xl font-black text-ink">SeeYa</div>
          <div
            className="text-[10px] uppercase tracking-[0.3em] text-coral mt-0.5"
            dir="ltr"
          >
            Admin Panel
          </div>
        </Link>
      </div>

      <div className="h-px mx-6 bg-ink/8" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? "bg-coral/10 text-coral"
                  : "text-ink/70 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="h-px mx-6 bg-ink/8" />

      {/* User card + logout */}
      <div className="p-4">
        <div className="px-3 py-2 mb-2">
          <div className="text-sm font-bold text-ink truncate">{userName}</div>
          <div className="text-xs text-ink/50 truncate" dir="ltr">
            {userEmail}
          </div>
        </div>
        <form action="/admin/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-ink/70 hover:bg-coral/10 hover:text-coral transition-colors"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
