import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Friendly empty-state block for admin list pages.
 *
 * Each list page used to render its own bespoke "ما في X" row, which
 * made the same screen look slightly different across surfaces and
 * usually offered no clear next action. This component standardizes
 * the shape: round icon, headline, supportive sentence, and (when
 * provided) a primary CTA that takes the admin straight to the next
 * step — adding a trip, creating a booking, inviting a client, etc.
 *
 * Designed to live INSIDE a card / table-cell wrapper, not as a
 * full-bleed page state — that way it slots in wherever the table
 * would otherwise render rows.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondary,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondary?: ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-coral/10 text-coral grid place-items-center mb-4">
        <Icon size={26} />
      </div>
      <h3 className="text-lg font-black text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink/60 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {primaryHref && primaryLabel && (
        <Link
          href={primaryHref}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {primaryLabel}
        </Link>
      )}
      {secondary && (
        <div className="mt-3 text-xs text-ink/50">{secondary}</div>
      )}
    </div>
  );
}
