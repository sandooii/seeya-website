"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { convertWaitlistToBooking } from "./actions";

export default function ConvertWaitlistButton({
  entryId,
  fullName,
}: {
  entryId: string;
  fullName: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleConvert = () => {
    if (
      !confirm(
        `تحويل ${fullName} لحجز جديد؟ بنعمل حجز "بانتظار المقدّم" وبنربطه بهالإدخال.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await convertWaitlistToBooking(entryId);
      if (result?.error && !result.bookingId) {
        setError(result.error);
        return;
      }
      // Either fully succeeded or has bookingId — navigate to it
      if (result?.bookingId) {
        router.push(`/admin/bookings/${result.bookingId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleConvert}
        disabled={pending}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ArrowRightLeft size={14} />
        )}
        <span>تحويل لحجز</span>
      </button>
      {error && (
        <span className="text-xs text-red-600 font-semibold">{error}</span>
      )}
    </div>
  );
}
