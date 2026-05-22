"use client";

import { useState, useTransition } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteBooking } from "./actions";

export default function DeleteBookingButton({
  bookingId,
  clientName,
}: {
  bookingId: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteBooking(bookingId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="حذف"
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink/60 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <Trash2 size={16} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-booking-title"
          className="fixed inset-0 z-[200] grid place-items-center px-4"
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 text-right"
            dir="rtl"
          >
            <button
              type="button"
              onClick={() => !pending && setOpen(false)}
              aria-label="إغلاق"
              className="absolute top-4 left-4 w-9 h-9 grid place-items-center rounded-full text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 grid place-items-center mb-4">
              <Trash2 size={20} />
            </div>

            <h2
              id="delete-booking-title"
              className="text-2xl font-black text-ink mb-2"
            >
              حذف الحجز؟
            </h2>
            <p className="text-ink/70 mb-2">
              متأكدة من حذف حجز{" "}
              <span className="font-bold text-ink">{clientName}</span>؟
            </p>
            <p className="text-ink/50 text-sm mb-6">
              هذا الإجراء لا يمكن التراجع عنه. إذا كان الحجز محسوباً ضمن مقاعد
              الرحلة، رح يرجع المقعد متاح.
            </p>

            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 text-sm bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-start">
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending && <Loader2 size={16} className="animate-spin" />}
                {pending ? "جاري الحذف..." : "نعم، احذفي"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-5 py-2.5 rounded-xl bg-ink/5 text-ink font-bold hover:bg-ink/10 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
