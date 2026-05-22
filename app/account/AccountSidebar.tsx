"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plane,
  Clock,
  User,
  LogOut,
  Heart,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

const NAV: NavItem[] = [
  { href: "/account", label: "الرئيسية", icon: Home },
  { href: "/account/trips", label: "رحلاتي", icon: Plane },
  { href: "/account/waitlist", label: "قائمة انتظاري", icon: Clock },
  { href: "/account/profile", label: "بياناتي", icon: User },
];

export default function AccountSidebar({
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
        <Link href="/" className="block">
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
      </div>

      <div className="h-px mx-6 bg-ink/8" />

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
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
        <div className="px-3 py-2 mb-2">
          <div className="text-sm font-bold text-ink truncate">{userName}</div>
          <div className="text-xs text-ink/50 truncate" dir="ltr">
            {userEmail}
          </div>
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
  );
}
