"use client";

import { useState } from "react";
import { Copy, MessageCircle, Sparkles } from "lucide-react";
import {
  TEMPLATE_CATALOG,
  welcomeMessage,
  depositReminderMessage,
  balanceReminderMessage,
  dayBeforeMessage,
  waToPhone,
  type TemplateKind,
} from "@/lib/whatsapp-templates";

/**
 * Per-client WhatsApp template picker. Lives on /admin/clients/[id]
 * and (optionally) on the booking edit page in a compact form.
 *
 * Admin chooses a template, the message is composed against the
 * client (and, where required, the active booking), then sent via
 * wa.me or copied to the clipboard.
 *
 * Templates that need a booking ("deposit reminder", "balance
 * reminder", "day before") only become enabled when the parent
 * passes an `activeBooking`. The catalog still renders them so SANDO
 * can see at a glance which messages exist — they're greyed out
 * with a tooltip explaining the prerequisite.
 */
export default function WhatsAppTemplatesPanel({
  clientName,
  phone,
  activeBooking,
}: {
  clientName: string;
  phone: string | null;
  activeBooking: {
    tripName: string;
    depositAmount: number;
    remaining: number;
    currency: "ILS" | "USD";
  } | null;
}) {
  const [previewKind, setPreviewKind] = useState<TemplateKind | null>(null);
  const [copied, setCopied] = useState(false);

  // Resolve the message text for a given template kind. Returns null
  // when the template needs a booking that we don't have.
  function compose(kind: TemplateKind): string | null {
    switch (kind) {
      case "welcome":
        if (!phone) return null;
        return welcomeMessage({ clientName, phone });
      case "deposit_reminder":
        if (!activeBooking) return null;
        return depositReminderMessage({
          clientName,
          tripName: activeBooking.tripName,
          depositAmount: activeBooking.depositAmount,
          currency: activeBooking.currency,
        });
      case "balance_reminder":
        if (!activeBooking) return null;
        return balanceReminderMessage({
          clientName,
          tripName: activeBooking.tripName,
          remaining: activeBooking.remaining,
          currency: activeBooking.currency,
        });
      case "day_before":
        if (!activeBooking) return null;
        return dayBeforeMessage({
          clientName,
          tripName: activeBooking.tripName,
        });
    }
  }

  const previewMessage = previewKind ? compose(previewKind) : null;
  const waLink = previewMessage ? waToPhone(phone, previewMessage) : null;

  async function handleCopy() {
    if (!previewMessage) return;
    try {
      await navigator.clipboard.writeText(previewMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: leave the textarea selectable.
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-ink/85">
        <Sparkles size={16} className="text-coral" />
        <h3 className="font-black">قوالب رسائل جاهزة</h3>
      </div>
      <p className="text-sm text-ink/55 -mt-2">
        اختاري قالب، عاينيه، وابعتيه بضغطة. القوالب اللي بدها رحلة
        نشطة بتظهر مفعّلة لما يكون عندها حجز.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TEMPLATE_CATALOG.map((tpl) => {
          const composed = compose(tpl.kind);
          const disabled = composed === null;
          const isActive = previewKind === tpl.kind;
          return (
            <button
              key={tpl.kind}
              type="button"
              disabled={disabled}
              onClick={() => setPreviewKind(tpl.kind)}
              title={
                disabled
                  ? "هاد القالب يحتاج رحلة نشطة للعميلة"
                  : tpl.hint
              }
              className={`text-right rounded-2xl border-2 px-4 py-3 transition-all ${
                disabled
                  ? "border-ink/10 bg-ink/3 text-ink/30 cursor-not-allowed"
                  : isActive
                    ? "border-coral bg-coral/10 text-ink shadow-[0_8px_22px_-12px_rgba(249,92,107,0.55)]"
                    : "border-ink/12 bg-white text-ink/85 hover:border-coral/40 hover:bg-coral/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base">{tpl.emoji}</span>
                <span className="text-sm font-bold">{tpl.title}</span>
              </div>
              <p
                className={`text-xs leading-relaxed ${
                  disabled ? "text-ink/30" : "text-ink/55"
                }`}
              >
                {tpl.hint}
              </p>
            </button>
          );
        })}
      </div>

      {previewMessage && (
        <div className="rounded-2xl border-2 border-ink/10 bg-pale p-4 space-y-3">
          <textarea
            readOnly
            value={previewMessage}
            rows={Math.min(12, previewMessage.split("\n").length + 1)}
            className="w-full bg-white rounded-xl border border-ink/12 px-3 py-2.5 text-sm text-ink/85 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-white text-sm font-bold hover:bg-ink/85 active:scale-[0.98] transition-all"
            >
              <Copy size={14} />
              {copied ? "اتنسخت ✓" : "نسخ"}
            </button>
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <MessageCircle size={14} />
                ابعتي بالواتساب
              </a>
            ) : (
              <p className="text-xs text-ink/45">
                أضيفي رقم تلفون صحيح للعميلة لتقدري تبعتي بالواتساب
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
