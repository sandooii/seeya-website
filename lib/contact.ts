/**
 * Single source of truth for SeeYa contact details.
 * Update here when phone/email/handle changes — every component pulls from this.
 */

export const CONTACT = {
  /** WhatsApp number in full international format (no + or dashes, no local leading 0) — used in wa.me links */
  whatsappIntl: "972544880123",
  /** Human-readable WhatsApp number — used in UI display */
  whatsappDisplay: "054-488-0123",
  /** Brand email */
  email: "seeyaa.ar@gmail.com",
  /** Instagram handle without the @ */
  instagramHandle: "seeyaa.ar",
  /** Full Instagram URL */
  instagramUrl: "https://instagram.com/seeyaa.ar",
} as const;

/**
 * Build a `wa.me` URL with an optional pre-filled message.
 *
 * @example
 * waLink("بدي أحجز رحلة تايلاند") // → "https://wa.me/972544880123?text=..."
 */
export function waLink(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappIntl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
