"use client";

import { useState } from "react";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { normalizePhone } from "@/lib/auth-helpers";

/**
 * Map any Israeli-shape phone string to a wa.me-compatible digits-only
 * E.164 number (no plus). 0xx → 972xx; +972xx → 972xx; otherwise pass
 * the digits as-is so admin can still WhatsApp foreign numbers.
 */
function toWaIntl(raw: string): string | null {
  const digits = normalizePhone(raw);
  if (digits.length < 7) return null;
  // 0501234567 → 972501234567
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

/**
 * One-shot success banner shown on the booking edit page when admin
 * just created a booking with the "auto-create account" checkbox.
 *
 * Surfaces the username/password (= phone digits) plus a ready-to-send
 * WhatsApp message with login link. Two buttons:
 *   - Copy the message to clipboard
 *   - Open WhatsApp with the message pre-filled to the client's number
 *
 * Built as a client component because we need clipboard + dynamic copy
 * feedback. The credentials themselves come from the phone (which is
 * already in the booking row) so we don't need to round-trip any
 * sensitive data through query params.
 */
export default function AccountCreatedBanner({
  clientName,
  phone,
}: {
  clientName: string;
  phone: string;
}) {
  const [copied, setCopied] = useState(false);

  const digits = normalizePhone(phone);
  const intl = toWaIntl(phone);

  // The login link points at the public /login route. The client uses
  // her phone digits as both username and password, per
  // app/login/actions.ts. Keep this URL relative — Vercel preview +
  // production both route on the same origin.
  const message = `مرحبا ${clientName} ✨

أهلاً بكِ بتجربة SeeYa الجديدة!

عندك حساب خاص فيكِ بتشوفي منه تفاصيل رحلتك، حالة الدفع، وقائمة التحضير.

الرابط: https://seeya-website.vercel.app/login
رقم الدخول: ${digits}
كلمة السر: ${digits}

(كلمة السر = نفس رقم تلفونك)

لأي سؤال، أنا هنا للمساعدة 🤍
SeeYa`;

  const waLink = intl
    ? `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
    : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // navigator.clipboard might fail in older browsers — show a hint
      window.alert("اضغطي مطوّل لنسخ النص يدوياً");
    }
  };

  return (
    <div className="rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-5 py-5 md:px-7 md:py-6">
      <div className="flex items-start gap-3 mb-4">
        <CheckCircle2
          size={24}
          className="text-emerald-700 shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-emerald-900 mb-1">
            تم إنشاء الحساب بنجاح
          </h2>
          <p className="text-sm text-emerald-900/85 leading-relaxed">
            <strong>{clientName}</strong> صار عندها حساب — اسم المستخدم
            والباسوورد كلاهما <code className="bg-white/70 px-1.5 py-0.5 rounded font-bold">{digits}</code>.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-200/60 p-4 mb-4 text-sm text-ink/80 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
        {message}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-white text-sm font-bold hover:bg-ink/85 active:scale-[0.98] transition-all"
        >
          <Copy size={15} />
          {copied ? "اتنسخت ✓" : "نسخ الرسالة"}
        </button>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <MessageCircle size={15} />
            افتحي واتساب
          </a>
        )}
      </div>
    </div>
  );
}
