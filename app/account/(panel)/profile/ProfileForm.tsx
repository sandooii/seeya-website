"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { updateProfile, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = {};

export default function ProfileForm({
  defaultName,
  defaultPhone,
  email,
}: {
  defaultName: string;
  defaultPhone: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  const err = (n: string) => state.fieldErrors?.[n];

  return (
    <form action={action} className="space-y-5" dir="rtl">
      <div className="space-y-2">
        <label className="block text-sm font-bold text-ink">
          الاسم الكامل{" "}
          <span className="text-coral">*</span>
        </label>
        <input
          name="full_name"
          defaultValue={defaultName}
          required
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60"
        />
        {err("full_name") && (
          <p className="text-xs text-red-600 font-semibold">
            {err("full_name")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-ink">
          رقم الواتساب{" "}
          <span className="text-coral">*</span>
        </label>
        <input
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          required
          dir="ltr"
          placeholder="+972 50 123 4567"
          className="w-full rounded-xl border border-ink/15 px-4 py-3 text-ink text-left tabular-nums focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60"
        />
        <p className="text-[11px] text-ink/45">
          ابدأي بـ +972 أو 0 — هاد هو رقمك بنفس الوقت كلمة السر
        </p>
        {err("phone") && (
          <p className="text-xs text-red-600 font-semibold">{err("phone")}</p>
        )}
      </div>

      {email ? (
        <div className="space-y-2">
          <label className="block text-sm font-bold text-ink/40">
            البريد الإلكتروني
          </label>
          <input
            value={email}
            readOnly
            dir="ltr"
            className="w-full rounded-xl border border-ink/10 bg-ink/3 px-4 py-3 text-ink/60 text-left cursor-not-allowed"
          />
          <p className="text-xs text-ink/40">
            ما بنقدر نعدّل الإيميل من هون — تواصلي معنا لو بدك تغيّريه
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink/10 bg-ink/3 px-4 py-3 text-sm text-ink/60">
          ما عندك إيميل مسجّل — بتسجلي دخول برقم تلفونك
        </div>
      )}

      {state.error && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-xl px-4 py-3 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>تم حفظ التغييرات ✓</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending && <Loader2 size={16} className="animate-spin" />}
        {pending ? "جاري الحفظ..." : "حفظ التعديلات"}
      </button>
    </form>
  );
}
