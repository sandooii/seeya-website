"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import {
  markBookingRefunded,
  unmarkBookingRefunded,
} from "./actions";

/**
 * Refund status panel for cancelled bookings on the admin edit page.
 *
 * Two states:
 *   - refundedAt is null → "علّمي تم الاسترداد" coral button.
 *   - refundedAt is set  → green confirmation badge with the date +
 *                          a small "تراجعي" undo button.
 *
 * Server actions live in ./actions (markBookingRefunded /
 * unmarkBookingRefunded) so the page revalidates and any open client
 * portal sees the updated state on the next request.
 */
export default function RefundStatusPanel({
  bookingId,
  initialRefundedAt,
  paidAmount,
}: {
  bookingId: string;
  initialRefundedAt: string | null;
  paidAmount: number;
}) {
  const [refundedAt, setRefundedAt] = useState<string | null>(
    initialRefundedAt,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Nothing collected from the client → there's nothing to refund.
  // We still show the panel so SANDO has the option (e.g. she
  // collected cash off-platform), but the default copy reflects
  // the "no money on file" state.
  const hasMoney = paidAmount > 0;

  const handleMark = () => {
    setError(null);
    startTransition(async () => {
      const res = await markBookingRefunded(bookingId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setRefundedAt(res.refundedAt ?? new Date().toISOString());
    });
  };

  const handleUndo = () => {
    setError(null);
    startTransition(async () => {
      const res = await unmarkBookingRefunded(bookingId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setRefundedAt(null);
    });
  };

  return (
    <section className="bg-white rounded-3xl border border-ink/5 p-6 md:p-7">
      <header className="mb-4">
        <h2 className="text-xl font-black text-ink">حالة الاسترداد</h2>
        <p className="text-ink/55 text-sm mt-1">
          {hasMoney
            ? "هذا الحجز ملغي وفيه مبلغ مدفوع. علّمي إنّك سدّدتي الاسترداد عشان العميلة تشوف التأكيد بحسابها."
            : "هذا الحجز ملغي وما فيه مبلغ مدفوع — مش لازم تعلّمي شي، لكن الخيار متاح."}
        </p>
      </header>

      {refundedAt ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
            <CheckCircle2
              size={20}
              className="text-emerald-700 shrink-0"
            />
            <div>
              <p className="text-emerald-900 font-bold text-sm">
                تم تسجيل الاسترداد
              </p>
              <p className="text-emerald-700/85 text-xs mt-0.5">
                بتاريخ <bdi dir="ltr">{formatDmy(refundedAt)}</bdi> · العميلة
                بتشوف &quot;تم الاسترداد&quot; بحسابها
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-ink/5 text-ink/70 text-sm font-bold hover:bg-ink/10 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RotateCcw size={14} />
            )}
            تراجعي
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleMark}
          disabled={pending}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          علّمي إنّه تم الاسترداد
        </button>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </section>
  );
}

/** Format an ISO date as DD.MM.YYYY — SANDO's preferred format. */
function formatDmy(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}
