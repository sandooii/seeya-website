"use client";

import { motion } from "framer-motion";

export default function WhatsApp() {
  return (
    <motion.a
      href="https://wa.me/9720544880123"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصلي معنا على واتساب"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.15, 1], opacity: 1 }}
      transition={{
        duration: 0.8,
        delay: 1.6,
        ease: [0.16, 1, 0.3, 1],
        times: [0, 0.7, 1],
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-6 left-6 z-[90] grid place-items-center w-14 h-14 rounded-full shadow-[0_15px_40px_-10px_rgba(37,211,102,0.6)] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/40"
      style={{ backgroundColor: "#25D366" }}
    >
      {/* Pulsing ring */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-50 animate-ping" />

      {/* WhatsApp glyph */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="white"
        aria-hidden
        className="relative z-10"
      >
        <path d="M16.003 3C9.374 3 4 8.374 4 15c0 2.39.69 4.62 1.88 6.5L4 29l7.7-1.84A11.94 11.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.63 3 16.003 3Zm0 21.7c-1.94 0-3.74-.55-5.27-1.5l-.38-.23-4.57 1.09 1.12-4.45-.25-.4A9.66 9.66 0 0 1 6.3 15c0-5.34 4.36-9.7 9.7-9.7s9.7 4.36 9.7 9.7-4.35 9.7-9.7 9.7Zm5.55-7.27c-.3-.15-1.79-.88-2.07-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.36.22-.66.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.6.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.68-1.62-.93-2.22-.24-.58-.49-.5-.68-.51l-.58-.01a1.12 1.12 0 0 0-.81.38c-.28.3-1.07 1.05-1.07 2.55s1.1 2.96 1.25 3.16c.15.2 2.15 3.28 5.21 4.6.73.31 1.3.5 1.74.65.73.23 1.4.2 1.93.12.59-.09 1.79-.73 2.04-1.43.25-.7.25-1.3.18-1.43-.07-.13-.27-.2-.57-.35Z" />
      </svg>

      {/* Tooltip — opens to the right of the button (button sits on left edge) */}
      <span className="absolute left-full ml-3 whitespace-nowrap px-3 py-1.5 rounded-full bg-ink text-white text-xs font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none">
        تواصلي معنا
      </span>
    </motion.a>
  );
}
