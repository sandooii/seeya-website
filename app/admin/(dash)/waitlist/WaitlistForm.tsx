"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { WaitlistRow, TripRow } from "@/lib/supabase/types";
import { waitlistStatusLabel } from "@/lib/waitlist";
import { type WaitlistFormState } from "./actions";

type Action = (
  prev: WaitlistFormState,
  formData: FormData,
) => Promise<WaitlistFormState>;

const initialState: WaitlistFormState = {};

type TripOption = Pick<TripRow, "id" | "name" | "country" | "status">;

const STATUS_OPTIONS = (
  ["waiting", "offered", "converted", "declined", "cancelled"] as const
).map((value) => ({ value, label: waitlistStatusLabel[value] }));

export default function WaitlistForm({
  entry,
  trips,
  action,
  submitLabel,
}: {
  entry?: WaitlistRow;
  trips: TripOption[];
  action: Action;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  const fieldError = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-8" dir="rtl">
      {state.error && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
          {state.error}
        </div>
      )}

      <Section title="معلومات المسافرة">
        <Field
          label="الاسم الكامل"
          error={fieldError("full_name")}
          required
        >
          <input
            name="full_name"
            defaultValue={entry?.full_name ?? ""}
            required
            className={inputClass}
            placeholder="مثال: نور أحمد"
          />
        </Field>

        <Field
          label="رقم الواتساب"
          error={fieldError("phone")}
          hint="ابدئي بـ + ومفتاح الدولة"
          required
        >
          <input
            name="phone"
            defaultValue={entry?.phone ?? ""}
            required
            dir="ltr"
            className={`${inputClass} text-left tabular-nums`}
            placeholder="+972 50 123 4567"
          />
        </Field>

        <Field label="الإيميل (اختياري)" error={fieldError("email")}>
          <input
            name="email"
            type="email"
            defaultValue={entry?.email ?? ""}
            dir="ltr"
            className={`${inputClass} text-left`}
            placeholder="noor@example.com"
          />
        </Field>
      </Section>

      <Section title="الرحلة والحالة">
        <Field label="الرحلة" error={fieldError("trip_id")} required>
          <select
            name="trip_id"
            defaultValue={entry?.trip_id ?? ""}
            required
            className={inputClass}
          >
            <option value="">— اختاري الرحلة —</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.country})
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="الحالة"
          error={fieldError("status")}
          hint="افتراضياً 'بانتظار' — تتغيّر يدوياً لما يصير شي"
          required
        >
          <select
            name="status"
            defaultValue={entry?.status ?? "waiting"}
            required
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="ملاحظات">
        <Field
          label="ملاحظات داخلية"
          error={fieldError("notes")}
          hint="تفضيلات السفر، سبب الرغبة بالرحلة، إلخ"
        >
          <textarea
            name="notes"
            defaultValue={entry?.notes ?? ""}
            rows={3}
            className={inputClass}
            placeholder="مثال: تفضّل غرفة زوجية، عيد ميلادها بنفس الفترة"
          />
        </Field>
      </Section>

      <div className="flex items-center justify-start gap-3 sticky bottom-0 bg-cream/90 backdrop-blur py-4 -mx-6 px-6 border-t border-ink/8 mt-10">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? "جاري الحفظ..." : submitLabel}
        </button>
        <Link
          href="/admin/waitlist"
          className="px-6 py-3 rounded-xl bg-ink/5 text-ink font-bold hover:bg-ink/10 transition-colors"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink/15 px-4 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/50 transition-all";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-3xl border border-ink/5 p-6 md:p-8">
      <header className="mb-5">
        <h2 className="text-xl font-black text-ink">{title}</h2>
        {hint && <p className="text-ink/50 text-sm mt-1">{hint}</p>}
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="md:col-span-1 last:md:col-span-2 space-y-1.5">
      {label && (
        <label className="block text-sm font-bold text-ink">
          {label}
          {required && <span className="text-coral mr-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink/45">{hint}</p>}
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}
