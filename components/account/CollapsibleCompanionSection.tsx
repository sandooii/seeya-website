"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type Accent = "coral" | "violet" | "amber" | "emerald" | "red";

const ACCENT: Record<Accent, string> = {
  coral: "bg-coral/10 text-coral",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
};

const PILL_ACCENT: Record<Accent, string> = {
  coral: "bg-coral/8 text-coral",
  violet: "bg-violet-50 text-violet-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
};

/**
 * Companion section that hides its long body behind a tap-to-expand
 * accordion. Used for the trip-companion sub-sections that ship a lot
 * of content (daily itinerary, warnings, tips, packing, restaurants,
 * recommendations) so the trip-detail page reads short on first open
 * and the client picks what she wants to dig into.
 *
 * Flight + Hotel sections deliberately stay always-open (CompanionSection)
 * because their content is small and the client needs it at a glance.
 *
 * `count` shows a small pill under the title — "11 يوم", "13 تحذير", etc.
 * — so the client knows what she's choosing to expand.
 */
export default function CollapsibleCompanionSection({
  title,
  icon,
  accent,
  count,
  countLabel,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: Accent;
  count: number;
  countLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-white rounded-3xl border border-ink/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-6 text-right hover:bg-ink/2 transition-colors"
      >
        <span
          className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${ACCENT[accent]}`}
        >
          {icon}
        </span>

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-ink">{title}</h2>
          <p className="mt-0.5">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${PILL_ACCENT[accent]}`}
            >
              <bdi className="tabular-nums">{count}</bdi> {countLabel}
            </span>
          </p>
        </div>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="grid place-items-center w-9 h-9 rounded-full bg-ink/5 text-ink/60 shrink-0"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-1 border-t border-ink/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
