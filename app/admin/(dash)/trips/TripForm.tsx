"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { TripRow } from "@/lib/supabase/types";
import PdfUpload from "@/components/admin/PdfUpload";
import ItineraryEditor from "@/components/admin/ItineraryEditor";
import { type TripFormState } from "./actions";

type Action = (
  prev: TripFormState,
  formData: FormData,
) => Promise<TripFormState>;

const initialState: TripFormState = {};

const STATUS_OPTIONS = [
  { value: "soon", label: "قريباً" },
  { value: "open", label: "مفتوح للتسجيل" },
  { value: "live", label: "مباشر الآن" },
  { value: "sold-out", label: "نفدت المقاعد" },
  { value: "completed", label: "انتهت" },
];

export default function TripForm({
  trip,
  action,
  submitLabel,
}: {
  trip?: TripRow;
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

      {/* ─── Basic info ─── */}
      <Section title="معلومات أساسية">
        <Field label="اسم الرحلة" error={fieldError("name")} required>
          <input
            name="name"
            defaultValue={trip?.name ?? ""}
            required
            maxLength={100}
            className={inputClass}
            placeholder="مثال: تايلاند · بوكيت"
          />
        </Field>

        <Field
          label="الـ slug (للرابط)"
          error={fieldError("slug")}
          hint="حروف صغيرة وأرقام وشرطات (-) فقط. سيظهر في الرابط."
          required
        >
          <input
            name="slug"
            defaultValue={trip?.slug ?? ""}
            required
            dir="ltr"
            className={`${inputClass} text-left`}
            placeholder="thailand-phuket"
          />
        </Field>

        <Field label="البلد" error={fieldError("country")} required>
          <input
            name="country"
            defaultValue={trip?.country ?? ""}
            required
            className={inputClass}
          />
        </Field>

        <Field label="الحالة" error={fieldError("status")} required>
          <select
            name="status"
            defaultValue={trip?.status ?? "soon"}
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

        <Field
          label="نص الشارة"
          error={fieldError("badge")}
          hint="النص اللي يظهر على بطاقة الرحلة"
          required
        >
          <input
            name="badge"
            defaultValue={trip?.badge ?? ""}
            required
            className={inputClass}
            placeholder="قريباً / مباشر / نفدت المقاعد"
          />
        </Field>

        <Field
          label="ترتيب العرض"
          error={fieldError("sort_order")}
          hint="رقم أصغر = يظهر أولاً"
        >
          <input
            name="sort_order"
            type="number"
            defaultValue={trip?.sort_order ?? 0}
            className={`${inputClass} text-left tabular-nums`}
            dir="ltr"
          />
        </Field>
      </Section>

      {/* ─── Dates / Duration ─── */}
      <Section title="التواريخ والمدة">
        <Field
          label="نص التاريخ المعروض"
          error={fieldError("month")}
          hint="هذا اللي يظهر للزائر — مثال: 25.06.2026 – 05.07.2026"
          required
        >
          <input
            name="month"
            defaultValue={trip?.month ?? ""}
            required
            dir="ltr"
            className={`${inputClass} text-left tabular-nums`}
          />
        </Field>

        <Field label="المدة" error={fieldError("duration")} required>
          <input
            name="duration"
            defaultValue={trip?.duration ?? ""}
            required
            className={inputClass}
            placeholder="مثال: 11 يوم"
          />
        </Field>

        <Field
          label="تاريخ البداية"
          error={fieldError("start_date")}
          hint="(اختياري — للترتيب والتذكيرات)"
        >
          <input
            name="start_date"
            type="date"
            defaultValue={trip?.start_date ?? ""}
            dir="ltr"
            className={`${inputClass} text-left`}
          />
        </Field>

        <Field
          label="تاريخ النهاية"
          error={fieldError("end_date")}
          hint="(اختياري)"
        >
          <input
            name="end_date"
            type="date"
            defaultValue={trip?.end_date ?? ""}
            dir="ltr"
            className={`${inputClass} text-left`}
          />
        </Field>

        <Field
          label="نص آخر موعد"
          error={fieldError("deadline")}
          hint="(اختياري) — مثال: ⏰ آخر موعد: 10.06.2026"
        >
          <input
            name="deadline"
            defaultValue={trip?.deadline ?? ""}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ─── Pricing / Seats ─── */}
      <Section title="الأسعار والمقاعد">
        <Field label="السعر" error={fieldError("price")} required>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={trip?.price ?? 0}
            className={`${inputClass} text-left tabular-nums`}
            dir="ltr"
          />
        </Field>

        <Field label="العملة" error={fieldError("currency")}>
          <select
            name="currency"
            defaultValue={trip?.currency ?? "ILS"}
            className={inputClass}
          >
            <option value="ILS">شيكل (₪)</option>
            <option value="USD">دولار ($)</option>
          </select>
        </Field>

        <Field
          label="عدد المقاعد الكلي"
          error={fieldError("total_spots")}
          required
        >
          <input
            name="total_spots"
            type="number"
            min="0"
            defaultValue={trip?.total_spots ?? 0}
            className={`${inputClass} text-left tabular-nums`}
            dir="ltr"
          />
        </Field>

        <Field
          label="المقاعد المتاحة الآن"
          error={fieldError("available_spots")}
          hint="عند بيع كل المقاعد، حطي 0 وغيري الحالة إلى 'نفدت المقاعد'"
          required
        >
          <input
            name="available_spots"
            type="number"
            min="0"
            defaultValue={trip?.available_spots ?? 0}
            className={`${inputClass} text-left tabular-nums`}
            dir="ltr"
          />
        </Field>

        <Field
          label="نص ملحق بالسعر"
          error={fieldError("price_subtitle")}
          hint="(اختياري) — مثال: للمسافرة في الغرفة الزوجية · شامل كل شي"
        >
          <input
            name="price_subtitle"
            defaultValue={trip?.price_subtitle ?? ""}
            className={inputClass}
          />
        </Field>

        <Field
          label="نص الدفعة الأولى"
          error={fieldError("deposit")}
          hint="(اختياري) — مثال: دفعة أولى 5,000 ₪ فقط"
        >
          <input
            name="deposit"
            defaultValue={trip?.deposit ?? ""}
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ─── Content ─── */}
      <Section title="المحتوى">
        <Field
          label="رابط الصورة"
          error={fieldError("image_url")}
          hint="مؤقتاً: ضعي رابط صورة (Unsplash مثلاً). قريباً: رفع مباشر."
          required
        >
          <input
            name="image_url"
            type="url"
            defaultValue={trip?.image_url ?? ""}
            required
            dir="ltr"
            className={`${inputClass} text-left`}
            placeholder="https://images.unsplash.com/..."
          />
        </Field>

        <Field label="الوصف المختصر" error={fieldError("blurb")} required>
          <textarea
            name="blurb"
            defaultValue={trip?.blurb ?? ""}
            required
            rows={3}
            className={inputClass}
            placeholder="وصف مختصر للرحلة يظهر تحت العنوان..."
          />
        </Field>
      </Section>

      {/* ─── PDF program ─── */}
      <Section
        title="برنامج الرحلة (PDF)"
        hint="بيظهر للعميلات على صفحة الرحلة كزر تحميل"
      >
        <div className="md:col-span-2">
          <PdfUpload
            tripId={trip?.id ?? null}
            tripName={trip?.name}
            currentPath={trip?.pdf_path ?? null}
            updatedAt={trip?.updated_at}
          />
        </div>
      </Section>

      {/* ─── Includes ─── */}
      <Section
        title="ما تشمله الرحلة"
        hint="ضعي كل بند على سطر منفصل"
      >
        <Field label="" error={fieldError("includes")}>
          <textarea
            name="includes"
            defaultValue={(trip?.includes ?? []).join("\n")}
            rows={6}
            className={`${inputClass} font-mono text-sm`}
            placeholder={"طيران ذهاباً وإياباً\nفندق 4 نجوم\n5 فعاليات منظمة"}
          />
        </Field>
      </Section>

      {/* ─── Itinerary — friendly day-by-day editor ─── */}
      <Section
        title="البرنامج التفصيلي"
        hint="أضيفي فقرة لكل يوم أو مجموعة أيام (مثلاً 'اليوم 1-2')"
      >
        <div className="md:col-span-2">
          <ItineraryEditor initial={trip?.itinerary ?? []} />
          {fieldError("itinerary") && (
            <p className="text-xs text-red-600 font-semibold mt-2">
              {fieldError("itinerary")}
            </p>
          )}
        </div>
      </Section>

      {/* ─── Submit ─── */}
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
          href="/admin/trips"
          className="px-6 py-3 rounded-xl bg-ink/5 text-ink font-bold hover:bg-ink/10 transition-colors"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}

// ─── helpers ───
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
