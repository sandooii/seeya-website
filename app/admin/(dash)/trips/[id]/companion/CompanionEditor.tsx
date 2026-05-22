"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plane,
  Hotel,
  Utensils,
  Compass,
  AlertTriangle,
  Lightbulb,
  Luggage,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";
import type {
  FlightInfo,
  HotelInfo,
  RecommendationItem,
  RestaurantItem,
  TripCompanion,
} from "@/lib/supabase/types";
import { saveTripCompanion } from "./actions";

export default function CompanionEditor({
  tripId,
  initial,
}: {
  tripId: string;
  initial: TripCompanion;
}) {
  const router = useRouter();
  const [content, setContent] = useState<TripCompanion>(initial ?? {});
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveTripCompanion(tripId, content);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Section
        title="معلومات الطيران"
        icon={<Plane size={18} />}
        accent="coral"
      >
        <FlightForm
          value={content.flight ?? {}}
          onChange={(v) => setContent({ ...content, flight: v })}
        />
      </Section>

      <Section
        title="الفندق"
        icon={<Hotel size={18} />}
        accent="violet"
      >
        <HotelForm
          value={content.hotel ?? {}}
          onChange={(v) => setContent({ ...content, hotel: v })}
        />
      </Section>

      <Section
        title="مطاعم موصى بها"
        icon={<Utensils size={18} />}
        accent="amber"
      >
        <RestaurantsEditor
          value={content.restaurants ?? []}
          onChange={(v) => setContent({ ...content, restaurants: v })}
        />
      </Section>

      <Section
        title="توصيات (أماكن وأنشطة)"
        icon={<Compass size={18} />}
        accent="emerald"
      >
        <RecommendationsEditor
          value={content.recommendations ?? []}
          onChange={(v) => setContent({ ...content, recommendations: v })}
        />
      </Section>

      <Section
        title="تحذيرات مهمة"
        icon={<AlertTriangle size={18} />}
        accent="red"
      >
        <StringListEditor
          value={content.warnings ?? []}
          onChange={(v) => setContent({ ...content, warnings: v })}
          placeholder="مثال: ما تشربي ماي الحنفية"
        />
      </Section>

      <Section
        title="نصائح عامة"
        icon={<Lightbulb size={18} />}
        accent="coral"
      >
        <StringListEditor
          value={content.tips ?? []}
          onChange={(v) => setContent({ ...content, tips: v })}
          placeholder="مثال: العملة بايت، احملي معك بايت صغير دايماً"
        />
      </Section>

      <Section
        title="ماذا تحضّري بالشنطة"
        icon={<Luggage size={18} />}
        accent="violet"
      >
        <StringListEditor
          value={content.packing ?? []}
          onChange={(v) => setContent({ ...content, packing: v })}
          placeholder="مثال: ملابس خفيفة، كريم شمس، صنادل"
        />
      </Section>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-md -mx-6 px-6 py-4 border-t border-ink/8 mt-10 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "جاري الحفظ..." : "حفظ كل التعديلات"}
        </button>
        {savedAt && (
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
            <CheckCircle2 size={14} />
            تم الحفظ {savedAt.toLocaleTimeString("en-GB")}
          </span>
        )}
        {error && (
          <span className="text-sm font-bold text-red-600">{error}</span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Section wrapper
// ────────────────────────────────────────────────

type Accent = "coral" | "violet" | "amber" | "emerald" | "red";

function Section({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent: Accent;
  children: React.ReactNode;
}) {
  const accentClass: Record<Accent, string> = {
    coral: "bg-coral/10 text-coral",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <details
      open
      className="bg-white rounded-3xl border border-ink/5 overflow-hidden group"
    >
      <summary className="px-6 py-4 flex items-center gap-3 cursor-pointer hover:bg-ink/2 transition-colors list-none">
        <span
          className={`w-9 h-9 rounded-xl grid place-items-center ${accentClass[accent]}`}
        >
          {icon}
        </span>
        <h2 className="text-lg font-black text-ink flex-1">{title}</h2>
        <span className="text-ink/30 text-xs group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="p-6 border-t border-ink/5">{children}</div>
    </details>
  );
}

// ────────────────────────────────────────────────
// Flight Form
// ────────────────────────────────────────────────

function FlightForm({
  value,
  onChange,
}: {
  value: FlightInfo;
  onChange: (v: FlightInfo) => void;
}) {
  const set = (k: keyof FlightInfo, v: string) =>
    onChange({ ...value, [k]: v || undefined });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="تاريخ المغادرة">
        <input
          type="date"
          dir="ltr"
          value={value.departure_date ?? ""}
          onChange={(e) => set("departure_date", e.target.value)}
          className={inputClass + " text-left"}
        />
      </Field>
      <Field label="وقت المغادرة">
        <input
          type="time"
          dir="ltr"
          value={value.departure_time ?? ""}
          onChange={(e) => set("departure_time", e.target.value)}
          className={inputClass + " text-left tabular-nums"}
        />
      </Field>
      <Field label="مطار المغادرة (كود)">
        <input
          value={value.departure_airport ?? ""}
          onChange={(e) => set("departure_airport", e.target.value)}
          dir="ltr"
          placeholder="TLV"
          className={inputClass + " text-left uppercase"}
        />
      </Field>
      <Field label="اسم مطار المغادرة">
        <input
          value={value.departure_airport_name ?? ""}
          onChange={(e) => set("departure_airport_name", e.target.value)}
          placeholder="بن غوريون"
          className={inputClass}
        />
      </Field>
      <Field label="مطار الوصول (كود)">
        <input
          value={value.arrival_airport ?? ""}
          onChange={(e) => set("arrival_airport", e.target.value)}
          dir="ltr"
          placeholder="BKK"
          className={inputClass + " text-left uppercase"}
        />
      </Field>
      <Field label="اسم مطار الوصول">
        <input
          value={value.arrival_airport_name ?? ""}
          onChange={(e) => set("arrival_airport_name", e.target.value)}
          placeholder="سوارنابومي"
          className={inputClass}
        />
      </Field>
      <Field label="شركة الطيران">
        <input
          value={value.airline ?? ""}
          onChange={(e) => set("airline", e.target.value)}
          placeholder="El Al / Turkish Airlines"
          className={inputClass}
        />
      </Field>
      <Field label="رقم الرحلة">
        <input
          value={value.flight_number ?? ""}
          onChange={(e) => set("flight_number", e.target.value)}
          dir="ltr"
          placeholder="LY 81"
          className={inputClass + " text-left tabular-nums"}
        />
      </Field>
      <Field label="مدة الرحلة">
        <input
          value={value.duration ?? ""}
          onChange={(e) => set("duration", e.target.value)}
          placeholder="11 ساعة و 30 دقيقة"
          className={inputClass}
        />
      </Field>
      <Field label="ملاحظات / تذكير" full>
        <textarea
          value={value.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="مثال: اوصلي للمطار قبل 3 ساعات، احضّري الجواز والفيزا"
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// ────────────────────────────────────────────────
// Hotel Form
// ────────────────────────────────────────────────

function HotelForm({
  value,
  onChange,
}: {
  value: HotelInfo;
  onChange: (v: HotelInfo) => void;
}) {
  const set = (k: keyof HotelInfo, v: string) =>
    onChange({ ...value, [k]: v || undefined });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="اسم الفندق">
        <input
          value={value.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Holiday Inn Phuket"
          className={inputClass}
        />
      </Field>
      <Field label="رقم تلفون الفندق">
        <input
          value={value.phone ?? ""}
          onChange={(e) => set("phone", e.target.value)}
          dir="ltr"
          placeholder="+66 76 ..."
          className={inputClass + " text-left tabular-nums"}
        />
      </Field>
      <Field label="العنوان" full>
        <input
          value={value.address ?? ""}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Patong Beach, Phuket, Thailand"
          className={inputClass}
        />
      </Field>
      <Field label="رابط الفندق على الخريطة" full>
        <input
          type="url"
          value={value.map_url ?? ""}
          onChange={(e) => set("map_url", e.target.value)}
          dir="ltr"
          placeholder="https://maps.google.com/..."
          className={inputClass + " text-left"}
        />
      </Field>
      <Field label="وقت الـ Check-in">
        <input
          type="time"
          value={value.checkin ?? ""}
          onChange={(e) => set("checkin", e.target.value)}
          dir="ltr"
          className={inputClass + " text-left tabular-nums"}
        />
      </Field>
      <Field label="وقت الـ Check-out">
        <input
          type="time"
          value={value.checkout ?? ""}
          onChange={(e) => set("checkout", e.target.value)}
          dir="ltr"
          className={inputClass + " text-left tabular-nums"}
        />
      </Field>
      <Field label="ملاحظات الفندق" full>
        <textarea
          value={value.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="مثال: قريب من السوق الليلي، WiFi مجاني"
          className={inputClass}
        />
      </Field>
    </div>
  );
}

// ────────────────────────────────────────────────
// Restaurants Editor
// ────────────────────────────────────────────────

function RestaurantsEditor({
  value,
  onChange,
}: {
  value: RestaurantItem[];
  onChange: (v: RestaurantItem[]) => void;
}) {
  const add = () => onChange([...value, { name: "" }]);
  const update = (i: number, patch: Partial<RestaurantItem>) => {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {value.map((r, i) => (
        <div
          key={i}
          className="bg-ink/3 rounded-2xl p-4 border border-ink/5 relative"
        >
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="حذف"
            className="absolute top-3 left-3 w-7 h-7 grid place-items-center rounded-full text-ink/40 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X size={14} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="اسم المطعم" required>
              <input
                value={r.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Tu Kab Khao"
                className={inputClass}
              />
            </Field>
            <Field label="نوع المطبخ">
              <input
                value={r.cuisine ?? ""}
                onChange={(e) => update(i, { cuisine: e.target.value })}
                placeholder="تايلاندي / بحري"
                className={inputClass}
              />
            </Field>
            <Field label="العنوان" full>
              <input
                value={r.address ?? ""}
                onChange={(e) => update(i, { address: e.target.value })}
                placeholder="Phuket Old Town"
                className={inputClass}
              />
            </Field>
            <Field label="رابط" full>
              <input
                type="url"
                value={r.url ?? ""}
                onChange={(e) => update(i, { url: e.target.value })}
                dir="ltr"
                placeholder="https://..."
                className={inputClass + " text-left"}
              />
            </Field>
            <Field label="ملاحظة" full>
              <input
                value={r.note ?? ""}
                onChange={(e) => update(i, { note: e.target.value })}
                placeholder="جربي الكاري الأخضر"
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      ))}
      <AddButton onClick={add} label="+ إضافة مطعم" />
    </div>
  );
}

// ────────────────────────────────────────────────
// Recommendations Editor
// ────────────────────────────────────────────────

function RecommendationsEditor({
  value,
  onChange,
}: {
  value: RecommendationItem[];
  onChange: (v: RecommendationItem[]) => void;
}) {
  const add = () => onChange([...value, { title: "" }]);
  const update = (i: number, patch: Partial<RecommendationItem>) => {
    const next = value.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {value.map((r, i) => (
        <div
          key={i}
          className="bg-ink/3 rounded-2xl p-4 border border-ink/5 relative"
        >
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="حذف"
            className="absolute top-3 left-3 w-7 h-7 grid place-items-center rounded-full text-ink/40 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X size={14} />
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="العنوان" required>
              <input
                value={r.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="Big Buddha"
                className={inputClass}
              />
            </Field>
            <Field label="التصنيف">
              <input
                value={r.category ?? ""}
                onChange={(e) => update(i, { category: e.target.value })}
                placeholder="معلم / نشاط / تسوق"
                className={inputClass}
              />
            </Field>
            <Field label="الوصف" full>
              <textarea
                value={r.description ?? ""}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={2}
                placeholder="تمثال بوذا الكبير على قمة الجبل — منظر خلاب"
                className={inputClass}
              />
            </Field>
            <Field label="رابط" full>
              <input
                type="url"
                value={r.url ?? ""}
                onChange={(e) => update(i, { url: e.target.value })}
                dir="ltr"
                placeholder="https://..."
                className={inputClass + " text-left"}
              />
            </Field>
          </div>
        </div>
      ))}
      <AddButton onClick={add} label="+ إضافة توصية" />
    </div>
  );
}

// ────────────────────────────────────────────────
// Simple string list (warnings, tips, packing)
// ────────────────────────────────────────────────

function StringListEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const update = (i: number, v: string) => {
    const next = value.slice();
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, ""]);

  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-ink/30 text-sm tabular-nums w-5 shrink-0">
            {i + 1}.
          </span>
          <input
            value={s}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="حذف"
            className="w-9 h-9 grid place-items-center rounded-lg text-ink/40 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <AddButton onClick={add} label="+ إضافة" />
    </div>
  );
}

// ────────────────────────────────────────────────
// Shared bits
// ────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-ink/15 px-3 py-2 text-ink text-sm bg-white focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/50 transition-all";

function Field({
  label,
  full,
  required,
  children,
}: {
  label: string;
  full?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""} space-y-1.5`}>
      <span className="block text-xs font-bold text-ink/70">
        {label}
        {required && <span className="text-coral mr-1">*</span>}
      </span>
      {children}
    </label>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-coral/40 text-coral text-sm font-bold hover:bg-coral/5 transition-colors"
    >
      <Plus size={14} />
      {label}
    </button>
  );
}
