"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, Mail, User, Phone, Info } from "lucide-react";
import { type ClientFormState } from "./actions";

type Action = (
  prev: ClientFormState,
  formData: FormData,
) => Promise<ClientFormState>;

const initialState: ClientFormState = {};

export default function ClientForm({
  defaultName,
  defaultPhone,
  defaultEmail,
  action,
  submitLabel,
  /** When true, the email field is editable (creating a new client). Otherwise read-only. */
  editableEmail,
}: {
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  action: Action;
  submitLabel: string;
  editableEmail: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const err = (n: string) => state.fieldErrors?.[n];

  return (
    <form action={formAction} className="space-y-6" dir="rtl">
      <div className="rounded-2xl border border-coral/20 bg-coral/5 px-4 py-3 flex items-start gap-2.5 text-sm">
        <Info size={16} className="text-coral shrink-0 mt-0.5" />
        <p className="text-ink/75">
          إنشاء الحساب بيخلي العميلة تقدر تدخل من{" "}
          <code className="bg-white px-1 py-0.5 rounded text-coral text-xs">
            /login
          </code>{" "}
          باستخدام إيميلها وكود لمرة واحدة. بنبعتلها رسالة على الواتساب بعدها
          عشان تفعّل حسابها.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-ink">
          الاسم الكامل
        </label>
        <div className="relative">
          <User
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            name="full_name"
            defaultValue={defaultName ?? ""}
            required
            className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60"
            placeholder="مثال: ليلى أحمد"
          />
        </div>
        {err("full_name") && (
          <p className="text-xs text-red-600 font-semibold">
            {err("full_name")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-ink">
          البريد الإلكتروني
        </label>
        <div className="relative">
          <Mail
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            name="email"
            type="email"
            defaultValue={defaultEmail ?? ""}
            readOnly={!editableEmail}
            required={editableEmail}
            dir="ltr"
            className={`w-full rounded-xl border pr-10 pl-4 py-3 text-left focus:outline-none focus:ring-2 transition-all ${
              editableEmail
                ? "border-ink/15 text-ink focus:ring-coral/40 focus:border-coral/60"
                : "border-ink/10 bg-ink/3 text-ink/60 cursor-not-allowed"
            }`}
            placeholder="leila@example.com"
          />
        </div>
        {!editableEmail && (
          <p className="text-xs text-ink/40">
            الإيميل هو طريقة تسجيل دخول العميلة — ما بنعدّله بعد إنشاء الحساب
          </p>
        )}
        {err("email") && (
          <p className="text-xs text-red-600 font-semibold">{err("email")}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-ink">
          رقم الواتساب
        </label>
        <div className="relative">
          <Phone
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30"
          />
          <input
            name="phone"
            type="tel"
            defaultValue={defaultPhone ?? ""}
            required
            dir="ltr"
            placeholder="+972 50 123 4567"
            className="w-full rounded-xl border border-ink/15 pr-10 pl-4 py-3 text-ink text-left tabular-nums focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/60"
          />
        </div>
        <p className="text-xs text-ink/45">
          أي حجوزات قديمة برقم الواتساب رح تنربط بالحساب تلقائياً
        </p>
        {err("phone") && (
          <p className="text-xs text-red-600 font-semibold">{err("phone")}</p>
        )}
      </div>

      {state.error && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "جاري الحفظ..." : submitLabel}
        </button>
        <Link
          href="/admin/clients"
          className="px-6 py-3 rounded-xl bg-ink/5 text-ink font-bold hover:bg-ink/10 transition-colors"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}
