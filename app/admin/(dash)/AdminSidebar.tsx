"use client";

import { useEffect, useState } from "react";
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
  Menu,
  X,
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

/**
 * Admin shell sidebar. On desktop (md+) renders as a sticky panel
 * that always takes its column in the flex layout. On mobile it
 * collapses into a slide-in drawer triggered by a fixed top bar.
 *
 * The drawer auto-closes on route change so a tap on a nav link
 * doesn't leave the overlay covering the destination page.
 */
export default function AdminSidebar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes — feels natural on
  // mobile after tapping a nav item. The single extra render is fine.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar — fixed so it survives scroll */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-ink/8 flex items-center justify-between px-4"
        dir="rtl"
      >
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="text-lg font-black text-ink">SeeYa</span>
          <span
            className="text-[9px] uppercase tracking-[0.3em] text-coral"
            dir="ltr"
          >
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="فتح القائمة"
          className="w-10 h-10 grid place-items-center rounded-xl text-ink/70 hover:bg-ink/5"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Backdrop — mobile only, visible when drawer is open */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer / sticky sidebar */}
      <aside
        dir="rtl"
        className={`
          fixed md:sticky inset-y-0 right-0 top-0 z-50 md:z-auto
          w-72 md:w-64 shrink-0 h-screen flex flex-col bg-white
          border-l border-ink/8 md:border-l-0 md:border-l md:border-ink/8
          transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="px-6 pt-7 pb-5 flex items-center justify-between">
          <Link href="/admin" className="block" onClick={() => setOpen(false)}>
            <div className="text-2xl font-black text-ink">SeeYa</div>
            <div
              className="text-[10px] uppercase tracking-[0.3em] text-coral mt-0.5"
              dir="ltr"
            >
              Admin Panel
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
            className="md:hidden w-9 h-9 grid place-items-center rounded-full text-ink/40 hover:text-ink hover:bg-ink/5"
          >
            <X size={18} />
          </button>
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
            <div className="text-sm font-bold text-ink truncate">
              {userName}
            </div>
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
    </>
  );
}
