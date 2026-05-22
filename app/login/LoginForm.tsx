"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, Mail, KeyRound, ArrowRight } from "lucide-react";
import {
  requestOtp,
  verifyOtp,
  type RequestOtpState,
  type VerifyOtpState,
} from "./actions";

const initialRequestState: RequestOtpState = {};
const initialVerifyState: VerifyOtpState = {};

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const [requestState, requestAction, requestPending] = useActionState(
    requestOtp,
    initialRequestState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyOtp,
    initialVerifyState,
  );

  const tokenInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the OTP input as soon as we land on the code step.
  useEffect(() => {
    if (requestState.sent) {
      tokenInputRef.current?.focus();
    }
  }, [requestState.sent]);

  // ─── Step 2: Code entry ───
  if (requestState.sent && requestState.email) {
    return (
      <form action={verifyAction} className="space-y-5" dir="rtl">
        <input type="hidden" name="email" value={requestState.email} />
        <input
          type="hidden"
          name="next"
          value={nextPath ?? "/account"}
        />

        <div className="rounded-xl bg-coral/5 border border-coral/15 px-4 py-3 text-right text-sm">
          <p className="text-ink/70">
            أرسلنا كود من 6 أرقام إلى{" "}
            <span dir="ltr" className="font-bold text-coral">
              {requestState.email}
            </span>
          </p>
          <p className="text-ink/50 text-xs mt-1">
            افحصي الإيميل (وصندوق الـ Junk أحياناً) وأدخلي الكود هون
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="token"
            className="block text-sm font-bold text-ink"
          >
            الكود
          </label>
          <div className="relative">
            <KeyRound
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
            />
            <input
              ref={tokenInputRef}
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              dir="ltr"
              placeholder="123456"
              className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink text-center text-2xl tracking-[0.5em] font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
            />
          </div>
        </div>

        {verifyState?.error && (
          <ErrorBox message={verifyState.error} />
        )}

        <button
          type="submit"
          disabled={verifyPending}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99] bg-coral"
        >
          {verifyPending && <Loader2 size={16} className="animate-spin" />}
          {verifyPending ? "جاري التحقق..." : "ادخلي"}
          {!verifyPending && <ArrowRight size={16} />}
        </button>

        <ResendOtp email={requestState.email} />
      </form>
    );
  }

  // ─── Step 1: Email entry ───
  return (
    <form action={requestAction} className="space-y-5" dir="rtl">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-bold text-ink">
          البريد الإلكتروني
        </label>
        <div className="relative">
          <Mail
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            dir="ltr"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink text-left focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60 transition-all"
          />
        </div>
        <p className="text-xs text-ink/45">
          رح نرسللك كود من 6 أرقام لإيميلك — مش بدنا باسوورد
        </p>
      </div>

      {requestState?.error && <ErrorBox message={requestState.error} />}

      <button
        type="submit"
        disabled={requestPending}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99] bg-coral"
      >
        {requestPending && <Loader2 size={16} className="animate-spin" />}
        {requestPending ? "جاري الإرسال..." : "أرسلي الكود"}
      </button>
    </form>
  );
}

function ResendOtp({ email }: { email: string }) {
  const [state, action, pending] = useActionState(requestOtp, {
    sent: true,
    email,
  } as RequestOtpState);

  return (
    <form action={action} className="text-center">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-ink/60 hover:text-coral disabled:opacity-50"
      >
        {pending ? "جاري إعادة الإرسال..." : "ما وصلكِ الكود؟ ارسليه تاني"}
      </button>
      {state.error && (
        <p className="text-xs text-red-600 mt-1">{state.error}</p>
      )}
    </form>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl px-4 py-3 text-sm text-right"
      style={{
        backgroundColor: "rgba(249,92,107,0.08)",
        color: "#c8324b",
        border: "1px solid rgba(249,92,107,0.25)",
      }}
    >
      {message}
    </div>
  );
}
