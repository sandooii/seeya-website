"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Link2, UserPlus, Sparkles } from "lucide-react";
import type {
  BookingRow,
  CurrencyCode,
  Profile,
  TripRow,
} from "@/lib/supabase/types";
import { bookingStatusLabel } from "@/lib/bookings";
import FlightOverrideSection from "./FlightOverrideSection";
import { type BookingFormState } from "./actions";

type Action = (
  prev: BookingFormState,
  formData: FormData,
) => Promise<BookingFormState>;

const initialState: BookingFormState = {};

type TripOption = Pick<
  TripRow,
  | "id"
  | "name"
  | "country"
  | "price"
  | "currency"
  | "status"
  | "available_spots"
>;

type ClientOption = Pick<Profile, "id" | "full_name" | "phone" | "email">;

const STATUS_OPTIONS = (
  ["pending_deposit", "deposit_paid", "paid_full", "cancelled"] as const
).map((value) => ({ value, label: bookingStatusLabel[value] }));

export default function BookingForm({
  booking,
  trips,
  clients,
  action,
  submitLabel,
  /** True when used in /admin/bookings/new — shows the auto-create
   *  client account checkbox. Edit screens hide it (the booking
   *  either already has an account or admin can convert via the
   *  separate ConvertToClientButton). */
  showAutoCreate = false,
}: {
  booking?: BookingRow;
  trips: TripOption[];
  clients: ClientOption[];
  action: Action;
  submitLabel: string;
  showAutoCreate?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Trip selector state — used to auto-fill price/currency
  const [tripId, setTripId] = useState<string>(booking?.trip_id ?? "");

  // Linked client picker — when set, the booking is associated with a
  // real account. Inline name/phone/email still get saved as a snapshot.
  const [clientId, setClientId] = useState<string>(booking?.client_id ?? "");

  // Inline client info — controlled so picking a client can auto-fill them.
  const [clientName, setClientName] = useState<string>(
    booking?.client_name ?? "",
  );
  const [clientPhone, setClientPhone] = useState<string>(
    booking?.client_phone ?? "",
  );
  const [clientEmail, setClientEmail] = useState<string>(
    booking?.client_email ?? "",
  );

  // Auto-create client account checkbox — ON by default when phone exists
  // and the booking isn't linked. Hidden on edit screens via showAutoCreate.
  const [createAccount, setCreateAccount] = useState(true);

  const handleClientPick = (newId: string) => {
    setClientId(newId);
    if (!newId) return;
    const picked = clients.find((c) => c.id === newId);
    if (!picked) return;
    // Auto-fill empty inline fields from the picked client
    if (picked.full_name) setClientName(picked.full_name);
    if (picked.phone) setClientPhone(picked.phone);
    if (picked.email) setClientEmail(picked.email);
  };

  const selectedTrip = useMemo(
    () => trips.find((t) => t.id === tripId),
    [trips, tripId],
  );

  // Total / paid / deposit are controlled when user picks a new trip,
  // but free-edit otherwise. We use uncontrolled inputs with `key` to
  // reset them when the trip changes.
  const tripKey = tripId || "no-trip";

  const fieldError = (name: string) => state.fieldErrors?.[name];

  // Defaults derived from booking OR selected trip
  const defaultTotal = booking?.total_amount ?? selectedTrip?.price ?? 0;
  const defaultCurrency: CurrencyCode =
    booking?.currency ?? selectedTrip?.currency ?? "USD";

  return (
    <form action={formAction} className="space-y-8" dir="rtl">
      {state.error && (
        <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
          {state.error}
        </div>
      )}

      {/* ─── Linked client picker ─── */}
      <Section
        title="ربط بعميلة مسجّلة (اختياري)"
        hint="إذا العميلة عندها حساب من /admin/clients، اختاريها من القائمة — بيتربط الحجز فيها وبتشوفه بصفحتها"
      >
        <input type="hidden" name="client_id" value={clientId} />
        <Field label="العميلة المسجّلة" full>
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-ink/40 shrink-0" />
            <select
              value={clientId}
              onChange={(e) => handleClientPick(e.target.value)}
              className={inputClass}
            >
              <option value="">— حجز يدوي (بدون ربط بحساب) —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name ?? "بدون اسم"}
                  {c.phone ? ` · ${c.phone}` : ""}
                  {c.email ? ` · ${c.email}` : ""}
                </option>
              ))}
            </select>
          </div>
        </Field>
      </Section>

      {/* ─── Client info ─── */}
      <Section
        title="معلومات العميلة"
        hint={
          clientId
            ? "بتعبت تلقائياً من العميلة اللي اخترتيها — تقدري تعدّليها"
            : undefined
        }
      >
        <Field
          label="الاسم الكامل"
          error={fieldError("client_name")}
          required
        >
          <input
            name="client_name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            className={inputClass}
            placeholder="مثال: سارة المحمد"
          />
        </Field>

        <Field
          label="رقم الواتساب"
          error={fieldError("client_phone")}
          hint="ابدئي بـ + ومفتاح الدولة (مثال: +972501234567)"
          required
        >
          <input
            name="client_phone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            required
            dir="ltr"
            className={`${inputClass} text-left tabular-nums`}
            placeholder="+972 50 123 4567"
          />
        </Field>

        <Field
          label="الإيميل (اختياري)"
          error={fieldError("client_email")}
        >
          <input
            name="client_email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            dir="ltr"
            className={`${inputClass} text-left`}
            placeholder="sarah@example.com"
          />
        </Field>
      </Section>

      {/* ─── Auto-create account (new bookings only, when not already linked) ─── */}
      {showAutoCreate && !clientId && (
        <section className="bg-gradient-to-br from-coral/8 to-coral/4 rounded-3xl border-2 border-coral/20 p-6 md:p-7">
          <label className="flex items-start gap-4 cursor-pointer group">
            <input
              type="checkbox"
              name="create_account"
              checked={createAccount}
              onChange={(e) => setCreateAccount(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-coral cursor-pointer shrink-0"
            />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-coral" />
                <h2 className="text-lg font-black text-ink">
                  أنشئي حساب لهذه العميلة مباشرة{" "}
                  <Sparkles
                    size={14}
                    className="inline -mt-1 text-coral"
                  />
                </h2>
              </div>
              <p className="text-sm text-ink/65">
                بنخلق لها حساب على{" "}
                <code className="bg-white/70 px-1.5 py-0.5 rounded text-coral text-xs">
                  /login
                </code>{" "}
                — بيتها <strong>رقم تلفونها</strong> = اليوزر = الباسوورد.
                بعد الحفظ بتقدري تبعتي بياناتها بضغطة واحدة.
              </p>
              <p className="text-xs text-ink/45 leading-relaxed">
                اذا شيلتي العلامة، بتحفظ الحجز فقط — تقدري دائماً تنشئي
                لها حساب لاحقاً من زر &quot;إنشاء حساب لهالعميلة&quot; بصفحة
                التعديل.
              </p>
            </div>
          </label>
        </section>
      )}

      {/* ─── Trip ─── */}
      <Section title="الرحلة والحالة">
        <Field label="الرحلة" error={fieldError("trip_id")} required full>
          <select
            name="trip_id"
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">— اختاري الرحلة —</option>
            {trips.map((t) => {
              const isFull = t.available_spots === 0;
              return (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.country})
                  {isFull
                    ? " — نفدت المقاعد"
                    : ` — ${t.available_spots} مقاعد`}
                </option>
              );
            })}
          </select>
          {selectedTrip && selectedTrip.available_spots === 0 && (
            <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 flex items-start gap-2">
              <span aria-hidden>⚠️</span>
              <span>
                <strong>تنبيه:</strong> هاي الرحلة مكتملة — صفر مقاعد متبقية.
                بقدر تكملي الحجز بس راح يخصم المقاعد للسالب. تأكدي قبل تحفظي.
              </span>
            </div>
          )}
        </Field>

        <Field
          label="حالة الحجز"
          error={fieldError("status")}
          hint="عند اختيار 'دفعت المقدّم' أو 'مدفوع بالكامل' بنخصم مقعد من الرحلة"
          required
        >
          <select
            name="status"
            defaultValue={booking?.status ?? "pending_deposit"}
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

      {/* ─── Payment ─── */}
      <Section
        title="الدفع"
        hint={
          selectedTrip
            ? `سعر الرحلة المعتمد: ${selectedTrip.price} ${selectedTrip.currency}`
            : undefined
        }
      >
        <Field label="العملة" error={fieldError("currency")}>
          <select
            key={`currency-${tripKey}`}
            name="currency"
            defaultValue={defaultCurrency}
            className={inputClass}
          >
            <option value="USD">دولار ($)</option>
            <option value="ILS">شيكل (₪)</option>
          </select>
        </Field>

        <Field
          label="المبلغ الإجمالي"
          error={fieldError("total_amount")}
          hint="بيتعبى تلقائياً من سعر الرحلة — تقدري تعدّليه"
          required
        >
          <input
            key={`total-${tripKey}`}
            name="total_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultTotal}
            className={`${inputClass} text-left tabular-nums`}
            dir="ltr"
          />
        </Field>

        <Field
          label="المقدّم المتفق عليه"
          error={fieldError("deposit_amount")}
          hint="المبلغ المطلوب كدفعة أولى لتأكيد الحجز"
        >
          <input
            name="deposit_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={booking?.deposit_amount ?? 0}
            className={`${inputClass} text-left tabular-nums`}
            dir="ltr"
          />
        </Field>

        <Field
          label="إجمالي ما دفعته حتى الآن"
          error={fieldError("paid_amount")}
          hint="أكبر شي بقدر يساوي المبلغ الإجمالي"
        >
          <input
            name="paid_amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={booking?.paid_amount ?? 0}
            className={`${inputClass} text-left tabular-nums`}
            dir="ltr"
          />
        </Field>
      </Section>

      {/* ─── Notes ─── */}
      <Section title="ملاحظات">
        <Field
          label="ملاحظات عامة"
          error={fieldError("notes")}
          hint="ملاحظات بتظهر للعميلة بصفحة 'دليل الرحلة' (مثلاً: تفضيلات الغرفة)"
        >
          <textarea
            name="notes"
            defaultValue={booking?.notes ?? ""}
            rows={3}
            className={inputClass}
            placeholder="مثال: غرفة زوجية، بدون لاكتوز، الرحلة عيد ميلاد"
          />
        </Field>

        <Field
          label="ملاحظات خاصة (Admin فقط)"
          error={fieldError("admin_notes")}
          hint="ما بتظهر للعميلة أبداً"
        >
          <textarea
            name="admin_notes"
            defaultValue={booking?.admin_notes ?? ""}
            rows={3}
            className={inputClass}
            placeholder="مثال: دفعت كاش يوم 15.05، باقي 500$"
          />
        </Field>
      </Section>

      {/* ─── Flight override (optional) ─── */}
      <FlightOverrideSection initial={booking?.flight_override ?? null} />

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
          href="/admin/bookings"
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
  full,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`space-y-1.5 ${full ? "md:col-span-2" : "md:col-span-1 last:md:col-span-2"}`}
    >
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
