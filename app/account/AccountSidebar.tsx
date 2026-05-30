"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plane,
  Clock,
  User,
  LogOut,
  Heart,
  Menu,
  X,
} from "lucide-react";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

// Trips is the landing page (no separate "home" tab) — Phase 11.1.
const NAV: NavItem[] = [
  { href: "/account", label: "رحلاتي", icon: Plane },
  { href: "/account/waitlist", label: "قائمة انتظاري", icon: Clock },
  { href: "/account/profile", label: "بياناتي", icon: User },
];

/**
 * Client account sidebar — mirrors the admin shell's responsive
 * behavior: sticky panel on md+, slide-in drawer with hamburger
 * trigger on mobile.
 */
export default function AccountSidebar({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Auto-close after navigation — intentional: drawer must collapse when
  // the URL changes (mobile tap on a nav item) and there's no callback
  // we can hang off router.push since Link drives it. One render churn
  // is acceptable.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Stack-aware scroll lock — shares state with any modal opened on top
  // so closing this drawer doesn't unlock the page while a modal is open.
  useBodyScrollLock(open);

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-ink/8 flex items-center justify-between px-4"
        dir="rtl"
      >
        <Link href="/account" className="flex items-baseline gap-2">
          <span className="text-lg font-black text-ink">SeeYa</span>
          <span
            className="text-[9px] uppercase tracking-[0.3em] text-coral"
            dir="ltr"
          >
            My account
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          {/* Quick logout — visible without opening the drawer so portrait
              clients on small phones don't have to dig through the slide-out
              panel to find it. */}
          <form action="/account/logout" method="post">
            <button
              type="submit"
              aria-label="تسجيل الخروج"
              className="inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-coral hover:bg-coral/10 text-sm font-bold transition-colors"
            >
              <LogOut size={16} />
              <span>خروج</span>
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح القائمة"
            className="w-10 h-10 grid place-items-center rounded-xl text-ink/70 hover:bg-ink/5"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        dir="rtl"
        className={`
          fixed md:sticky inset-y-0 right-0 top-0 z-50 md:z-auto
          w-72 md:w-64 shrink-0 h-[100dvh] md:h-screen flex flex-col bg-white
          border-l border-ink/8
          transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="px-6 pt-7 pb-5 flex items-center justify-between">
          <Link href="/" className="block" onClick={() => setOpen(false)}>
            <div className="text-2xl font-black text-ink">SeeYa</div>
            <div className="flex items-center gap-1 mt-0.5">
              <Heart size={10} className="text-coral fill-coral" />
              <span
                className="text-[10px] uppercase tracking-[0.3em] text-coral"
                dir="ltr"
              >
                My account
              </span>
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

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            // "رحلاتي" lights up on /account and any /account/trips/* page
            // (the companion detail page). Other items match by prefix.
            const active =
              item.href === "/account"
                ? pathname === "/account" ||
                  pathname.startsWith("/account/trips")
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

        <div className="p-4">
          <div className="px-3 py-2 mb-2 text-right">
            <div className="text-sm font-bold text-ink truncate">
              {userName}
            </div>
            {userEmail && (
              <div className="text-xs text-ink/50 truncate mt-0.5">
                <bdi className="tabular-nums">{userEmail}</bdi>
              </div>
            )}
          </div>
          <form action="/account/logout" method="post">
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
