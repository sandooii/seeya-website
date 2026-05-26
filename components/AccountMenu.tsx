"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";

/**
 * Logged-in client dropdown for the public navbar.
 *
 * Renders the user's first name as a pill button; clicking it opens a
 * small menu with two actions: "حسابي" (link to /account) and "تسجيل
 * خروج" (POST to /account/logout). This is the only place on the
 * public site where a signed-in client can sign out — without it she
 * has to navigate into /account and find the sidebar logout.
 *
 * The wrapper stops click propagation so this dropdown can live inside
 * the navbar's mobile drawer without the drawer closing on the toggle
 * click.
 */
export default function AccountMenu({
  firstName,
  variant,
}: {
  firstName: string;
  variant: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pill = `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md transition-colors ${
    variant === "light"
      ? "bg-white/15 border border-white/30 text-white hover:bg-white/25"
      : "bg-coral/10 border border-coral/30 text-coral hover:bg-coral/20"
  }`;

  return (
    <div
      ref={ref}
      className="relative"
      onClick={(e) => e.stopPropagation()}
      dir="rtl"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={pill}
      >
        <User size={14} className="shrink-0" />
        <span className="max-w-[110px] truncate">{firstName}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full mt-2 left-0 w-48 bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(26,10,12,0.18)] border border-ink/10 overflow-hidden z-50"
        >
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-ink hover:bg-pale transition-colors"
          >
            <User size={15} className="text-coral" />
            <span>حسابي</span>
          </Link>
          <form
            action="/account/logout"
            method="post"
            className="border-t border-ink/8"
          >
            <button
              type="submit"
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-ink/75 hover:bg-coral/10 hover:text-coral transition-colors"
            >
              <LogOut size={15} />
              <span>تسجيل الخروج</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
