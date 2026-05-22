"use client";

import { useActionState } from "react";
import { Loader2, User, Phone } from "lucide-react";
import { completeProfile, type WelcomeState } from "./actions";

const initialState: WelcomeState = {};

export default function WelcomeForm({
  defaultName,
  nextPath,
}: {
  defaultName?: string;
  nextPath?: string;
}) {
  const [state, action, pending] = useActionState(
    completeProfile,
    initialState,
  );

  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={action} className="space-y-5" dir="rtl">
      <input type="hidden" name="next" value={nextPath ?? "/account"} />

      <div className="space-y-2">
        <label
          htmlFor="full_name"
          className="block text-sm font-bold text-ink"
        >
          اسمك الكامل
        </label>
        <div className="relative">
          <User
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            defaultValue={defaultName ?? ""}
            placeholder="مثال: نور أحمد"
            className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
          />
        </div>
        {err("full_name") && (
          <p className="text-xs text-red-600 font-semibold">
            {err("full_name")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-bold text-ink">
          رقم الواتساب
        </label>
        <div className="relative">
          <Phone
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            dir="ltr"
            placeholder="+972 50 123 4567"
            className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink text-left tabular-nums focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
          />
        </div>
        <p className="text-xs text-ink/45">
          ابدئي بـ + ومفتاح الدولة — هاد بساعدنا نربط حجوزاتك السابقة
          (لو كنتي حجزتي قبل تسجيلك)
        </p>
        {err("phone") && (
          <p className="text-xs text-red-600 font-semibold">{err("phone")}</p>
        )}
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-sm text-right"
          style={{
            backgroundColor: "rgba(249,92,107,0.08)",
            color: "#c8324b",
            border: "1px solid rgba(249,92,107,0.25)",
          }}
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99] bg-coral"
      >
        {pending && <Loader2 size={16} className="animate-spin" />}
        {pending ? "جاري الحفظ..." : "ابدئي ✨"}
      </button>
    </form>
  );
}
