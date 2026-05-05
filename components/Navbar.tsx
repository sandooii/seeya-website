"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links: { label: string; href: string; external?: boolean }[] = [
  { label: "رحلاتنا", href: "#trips" },
  { label: "تواصلي معنا", href: "https://wa.me/9720544880123", external: true },
  { label: "أسئلتكِ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl shadow-[0_4px_30px_-10px_rgba(26,10,12,0.12)]"
          : "bg-transparent"
      }`}
    >
      <nav className="flex items-center h-16 md:h-20 px-5 md:px-10 max-w-7xl mx-auto w-full relative">
        {/* LOGO — absolute center */}
        <a
          href="#top"
          aria-label="SeeYa"
          className="absolute left-1/2 -translate-x-1/2 z-10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scrolled ? "/logo-pink.png" : "/logo-white.png"}
            alt="SeeYa"
            style={{
              height: "44px",
              width: "auto",
              objectFit: "contain",
            }}
          />
        </a>

        {/* NAV LINKS — force to far visual LEFT using dir="ltr" */}
        <ul
          dir="ltr"
          className="hidden md:flex items-center gap-8 list-none ml-0 mr-auto"
        >
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                {...(l.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className={`relative text-sm font-medium transition-colors ${
                  scrolled ? "text-ink/85 hover:text-coral" : "text-white/95 hover:text-white"
                } group`}
              >
                {l.label}
                <span className="absolute -bottom-1.5 right-0 left-auto h-0.5 w-0 bg-coral transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        {/* MOBILE BUTTON — far right */}
        <div className="md:hidden ml-auto">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className={`grid place-items-center w-10 h-10 rounded-full transition-colors ${
              scrolled ? "bg-pale text-ink" : "bg-white/15 backdrop-blur text-white"
            }`}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white border-t border-pale px-6 py-5 shadow-soft"
          >
            <ul className="flex flex-col gap-4">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    onClick={() => setOpen(false)}
                    href={l.href}
                    {...(l.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="block text-base font-semibold text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
