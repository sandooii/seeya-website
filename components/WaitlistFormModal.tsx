"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  X,
  Bell,
  User as UserIcon,
  Phone as PhoneIcon,
  Mail,
} from "lucide-react";
import {
  joinWaitlistBySlug,
  type JoinWaitlistResult,
} from "@/app/actions/waitlist";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { useFocusTrap } from "@/lib/use-focus-trap";

const initialState: JoinWaitlistResult = { ok: true };

/**
 * Inline waitlist signup. Renders the trigger button passed via
 * `trigger` (rendered as-is, with onClick wired up), and a centered
 * modal containing the form.
 *
 * The action call is bound to the specific trip slug so each modal
 * instance is locked to one trip.
 */
export default function WaitlistFormModal({
  tripSlug,
  tripName,
  triggerLabel,
  triggerClassName,
  triggerIcon,
}: {
  tripSlug: string;
  tripName: string;
  triggerLabel: string;
  triggerClassName: string;
  triggerIcon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const boundAction = joinWaitlistBySlug.bind(null, tripSlug);
  const [state, action, pending] = useActionState(boundAction, initialState);

  // Reset open state when the user starts a fresh submission cycle
  // (e.g. they got an error, fixed it, and clicked outside to close).
  const success = state.ok === true && !pending && state !== initialState;

  // Stack-aware scroll lock: shares state with other open modals so
  // closing this one doesn't unlock the page when TripModal is still
  // on top.
  useBodyScrollLock(open);

  // Trap Tab focus inside the dialog while it's open + restore focus
  // to the trigger button on close.
  const dialogRef = useFocusTrap<HTMLDivElement>(open);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !pending && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pending]);

  // Auto-close the success state after a beat so the client doesn't
  // have to hunt for the close button on a small phone. We still keep
  // the manual 'خلصت' button as the explicit affordance.
  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => setOpen(false), 2500);
    return () => window.clearTimeout(id);
  }, [success]);

  const err = (n: string) =>
    state.ok === false ? state.fieldErrors?.[n] : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerIcon}
        {triggerLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] grid place-items-center px-4 py-4 overflow-y-auto"
          onClick={() => !pending && setOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            ref={dialogRef}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 md:p-7 text-right my-auto"
            dir="rtl"
          >
            <button
              type="button"
              onClick={() => !pending && setOpen(false)}
              aria-label="إغلاق"
              className="absolute top-4 left-4 w-9 h-9 grid place-items-center rounded-full text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors z-10"
            >
              <X size={18} />
            </button>

            {!success ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-coral/15 text-coral grid place-items-center mb-4">
                  <Bell size={22} />
                </div>
                <h2 className="text-2xl font-black text-ink mb-1">
                  انضمي لقائمة الانتظار
                </h2>
                <p className="text-ink/65 text-sm mb-5">
                  <strong>{tripName}</strong> — بنبلغك أول لما يصير في مكان ✨
                </p>

                <form action={action} className="space-y-4">
                  <Field label="الاسم الكامل" error={err("full_name")}>
                    <div className="relative">
                      <UserIcon
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
                      />
                      <input
                        name="full_name"
                        required
                        placeholder="مثال: ليلى أحمد"
                        className={inputClass}
                      />
                    </div>
                  </Field>

                  <Field
                    label="رقم الواتساب"
                    error={err("phone")}
                    hint="ابدأي بـ +972 أو 0"
                  >
                    <div className="relative">
                      <PhoneIcon
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
                      />
                      <input
                        name="phone"
                        type="tel"
                        required
                        dir="ltr"
                        placeholder="+972 50 123 4567"
                        className={`${inputClass} text-left tabular-nums`}
                      />
                    </div>
                  </Field>

                  <Field
                    label="الإيميل (اختياري)"
                    error={err("email")}
                  >
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
                      />
                      <input
                        name="email"
                        type="email"
                        dir="ltr"
                        placeholder="leila@example.com"
                        className={`${inputClass} text-left`}
                      />
                    </div>
                  </Field>

                  <Field label="ملاحظات (اختياري)">
                    <textarea
                      name="notes"
                      rows={2}
                      placeholder="مثل: أريد غرفة منفصلة، أو ملاحظة عن المواعيد"
                      className={inputClass}
                    />
                  </Field>

                  {state.ok === false && state.error && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200"
                    >
                      {state.error}
                    </div>
                  )}

                  {/* Sticky submit so the call-to-action stays visible
                      no matter how tall the form is (especially when the
                      mobile keyboard is open). */}
                  <div className="sticky bottom-0 -mx-6 md:-mx-7 px-6 md:px-7 pb-2 pt-3 bg-gradient-to-t from-white via-white to-white/95">
                    <button
                      type="submit"
                      disabled={pending}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_30px_-10px_rgba(249,92,107,0.55)]"
                    >
                      {pending && <Loader2 size={16} className="animate-spin" />}
                      {pending ? "جاري التسجيل..." : "✨ سجّليني بقائمة الانتظار"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 grid place-items-center mx-auto mb-4">
                  <CheckCircle2 size={28} />
                </div>
                <h2 className="text-2xl font-black text-ink mb-2">
                  تم تسجيلك! 🎉
                </h2>
                <p className="text-ink/70 text-sm mb-3">
                  سجّلناكِ بقائمة الانتظار لرحلة{" "}
                  <strong>{tripName}</strong>.
                </p>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 text-sm mb-6">
                  📱 بنبلغك على الواتساب خلال 24 ساعة لما يصير في مكان.
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-ink text-white font-bold hover:brightness-110"
                >
                  خلصت
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink/15 pr-9 pl-3 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/50 transition-all";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-bold text-ink">{label}</label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-ink/45">{hint}</p>
      )}
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}
