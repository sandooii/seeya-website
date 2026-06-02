/**
 * WhatsApp message templates that admin sends to clients from the
 * CRM. Each template takes typed inputs (client name, trip name,
 * amounts) and returns the formatted message, so we never duplicate
 * the wording across the codebase and SANDO can iterate on phrasing
 * in one place.
 *
 * Used by:
 *   - The booking edit page's AccountCreatedBanner (welcome message
 *     after auto-create), though that one is inlined for now.
 *   - The new Client Profile view at /admin/clients/[id] (a row of
 *     "send X" buttons that build wa.me links from these templates).
 */

import { normalizePhone } from "./auth-helpers";

/**
 * Map any phone string to a wa.me-compatible E.164 (digits only, no
 * plus). Treats a leading "0" as the Israeli local prefix and swaps it
 * for the country code "972". Returns null when there aren't enough
 * digits to form a real number.
 */
export function phoneToWaIntl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = normalizePhone(raw);
  if (digits.length < 7) return null;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

/**
 * Build a wa.me URL for a specific phone with an optional pre-filled
 * body. Returns null when the phone isn't valid — the UI should hide
 * the button in that case rather than render a broken link.
 */
export function waToPhone(
  phone: string | null | undefined,
  message: string,
): string | null {
  const intl = phoneToWaIntl(phone);
  if (!intl) return null;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

/**
 * Format an amount + currency the way SANDO writes it everywhere else
 * in the site: number first, currency symbol after, no decimal noise.
 */
function money(amount: number | null | undefined, currency: "ILS" | "USD"): string {
  const n = Math.round(Number(amount ?? 0)).toLocaleString("en-US");
  return currency === "USD" ? `${n} $` : `${n} ₪`;
}

/**
 * The shared signoff every template ends with — keeps the brand voice
 * consistent across welcome / reminder / pre-departure messages.
 */
const SIGNOFF = `\n\nلأي سؤال، أنا هنا للمساعدة 🤍\nSeeYa`;

/** Public production login URL — used by templates that share it. */
const LOGIN_URL = "https://seeya-website.vercel.app/login";

// ─── Template 1: Welcome + login credentials ───────────────────────

export function welcomeMessage(input: {
  clientName: string;
  phone: string;
}): string {
  const digits = normalizePhone(input.phone);
  return `مرحبا ${input.clientName} ✨

أهلاً بكِ بتجربة SeeYa الجديدة!

عندك حساب خاص فيكِ بتشوفي منه تفاصيل رحلتك، حالة الدفع، وقائمة التحضير.

الرابط: ${LOGIN_URL}
رقم الدخول: ${digits}
كلمة السر: ${digits}

(كلمة السر = نفس رقم تلفونك)${SIGNOFF}`;
}

// ─── Template 2: Deposit reminder ──────────────────────────────────

export function depositReminderMessage(input: {
  clientName: string;
  tripName: string;
  depositAmount: number;
  currency: "ILS" | "USD";
}): string {
  return `مرحبا ${input.clientName} 🌸

تذكير لطيف بخصوص رحلة ${input.tripName} —
لتأكيد حجزك بنحتاج المقدّم ${money(input.depositAmount, input.currency)}.

كل ما يصلنا المقدّم بنثبت لكِ المقعد فوراً.

تقدري تشوفي حالة الدفع من حسابك:
${LOGIN_URL}${SIGNOFF}`;
}

// ─── Template 3: Balance reminder ──────────────────────────────────

export function balanceReminderMessage(input: {
  clientName: string;
  tripName: string;
  remaining: number;
  currency: "ILS" | "USD";
}): string {
  return `مرحبا ${input.clientName} ✨

اقتربنا من موعد سفر ${input.tripName}!
متبقي من الدفع: ${money(input.remaining, input.currency)}.

اذا بتقدري تكملي الباقي بأقرب وقت، بنكون مرتاحات قبل السفر.

التفاصيل بحسابك:
${LOGIN_URL}${SIGNOFF}`;
}

// ─── Template 4: Day-before-departure reminder ─────────────────────

export function dayBeforeMessage(input: {
  clientName: string;
  tripName: string;
}): string {
  return `مرحبا ${input.clientName} 🛫

غداً سفر ${input.tripName}! ✨

🧳 تأكدي إنك حضّرتي:
  • الباسبورت ساري (٦ شهور على الأقل)
  • تأمين السفر
  • شواحن + محوّل كهرباء
  • أدويتك الشخصية لو في
  • صورة من الباسبورت بالموبايل

⏰ كوني بالمطار قبل ٣ ساعات من موعد الإقلاع.

كل تفاصيل الرحلة بحسابك:
${LOGIN_URL}${SIGNOFF}`;
}

// ─── Catalog (used by the UI to enumerate available templates) ─────

export type TemplateKind =
  | "welcome"
  | "deposit_reminder"
  | "balance_reminder"
  | "day_before";

export type TemplateMeta = {
  kind: TemplateKind;
  title: string;
  /** One-line description shown next to the title in the picker. */
  hint: string;
  /** Emoji shown in the button — matches the message vibe. */
  emoji: string;
};

export const TEMPLATE_CATALOG: TemplateMeta[] = [
  {
    kind: "welcome",
    title: "ترحيب + بيانات الدخول",
    hint: "اليوزر + الباسوورد + رابط الحساب",
    emoji: "✨",
  },
  {
    kind: "deposit_reminder",
    title: "تذكير دفع المقدّم",
    hint: "تأكيد الحجز بعد دفع المقدّم المطلوب",
    emoji: "💰",
  },
  {
    kind: "balance_reminder",
    title: "تذكير دفع الباقي",
    hint: "المبلغ المتبقي قبل السفر",
    emoji: "⏳",
  },
  {
    kind: "day_before",
    title: "تذكير قبل السفر بيوم",
    hint: "قائمة التحضير + موعد الوصول للمطار",
    emoji: "🛫",
  },
];
