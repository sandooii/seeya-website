"use client";

import { useActionState } from "react";
import { Loader2, Phone, KeyRound, ArrowRight } from "lucide-react";
import { signInWithPassword, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5" dir="rtl">
      <input type="hidden" name="next" value={nextPath ?? "/account"} />

      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-bold text-ink">
          رقم تلفونك
        </label>
        <div className="relative">
          <Phone
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            id="username"
            name="username"
            type="text"
            inputMode="tel"
            autoComplete="username"
            required
            dir="ltr"
            placeholder="+972 50 123 4567"
            className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink text-left tabular-nums focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
          />
        </div>
        <p className="text-xs text-ink/45">
          ابدأي بـ +972 أو 0 — أو ادخلي إيميلك إذا حابة
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-bold text-ink">
          كلمة السر
        </label>
        <div className="relative">
          <KeyRound
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
            placeholder="••••••••"
            className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink text-left tabular-nums focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
          />
        </div>
        <p className="text-xs text-ink/45">
          كلمة السر هي{" "}
          <span className="font-bold text-coral">رقم تلفونك</span>{" "}
          (أرقام فقط، بدون مسافات أو +)
        </p>
      </div>

      {state?.error && (
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
        {pending ? "جاري الدخول..." : "ادخلي"}
        {!pending && <ArrowRight size={16} />}
      </button>
    </form>
  );
}
