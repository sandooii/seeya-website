"use client";

import { useActionState } from "react";
import { signInWithPassword, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, isPending] = useActionState(
    signInWithPassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5" dir="rtl">
      <input type="hidden" name="next" value={nextPath ?? "/admin"} />

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-bold text-ink"
        >
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          dir="ltr"
          placeholder="you@example.com"
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-ink text-left focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-bold text-ink"
        >
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          dir="ltr"
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-ink text-left focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
        />
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
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
        style={{ backgroundColor: "#F95C6B" }}
      >
        {isPending ? "جاري التحقق..." : "تسجيل الدخول"}
      </button>
    </form>
  );
}
