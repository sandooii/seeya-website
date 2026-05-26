"use client";

import type { FlightInfo } from "@/lib/supabase/types";

/**
 * Reusable form for editing a single FlightInfo object. Used by:
 *   - Companion editor — to set the trip's default outbound and return flights
 *   - Booking form — to set a per-booking flight override
 *
 * Stateless on its own: parent owns the FlightInfo and handles serialization.
 */
export default function FlightFieldsEditor({
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
      <FieldWrap label="تاريخ المغادرة">
        <input
          type="date"
          dir="ltr"
          value={value.departure_date ?? ""}
          onChange={(e) => set("departure_date", e.target.value)}
          className={`${inputClass} text-left`}
        />
      </FieldWrap>
      <FieldWrap label="وقت المغادرة">
        <input
          type="time"
          dir="ltr"
          value={value.departure_time ?? ""}
          onChange={(e) => set("departure_time", e.target.value)}
          className={`${inputClass} text-left tabular-nums`}
        />
      </FieldWrap>
      <FieldWrap label="مطار المغادرة (كود)">
        <input
          value={value.departure_airport ?? ""}
          onChange={(e) => set("departure_airport", e.target.value)}
          dir="ltr"
          placeholder="TLV"
          className={`${inputClass} text-left uppercase`}
        />
      </FieldWrap>
      <FieldWrap label="اسم مطار المغادرة">
        <input
          value={value.departure_airport_name ?? ""}
          onChange={(e) => set("departure_airport_name", e.target.value)}
          placeholder="بن غوريون"
          className={inputClass}
        />
      </FieldWrap>
      <FieldWrap label="مطار الوصول (كود)">
        <input
          value={value.arrival_airport ?? ""}
          onChange={(e) => set("arrival_airport", e.target.value)}
          dir="ltr"
          placeholder="BKK"
          className={`${inputClass} text-left uppercase`}
        />
      </FieldWrap>
      <FieldWrap label="اسم مطار الوصول">
        <input
          value={value.arrival_airport_name ?? ""}
          onChange={(e) => set("arrival_airport_name", e.target.value)}
          placeholder="سوارنابومي"
          className={inputClass}
        />
      </FieldWrap>
      <FieldWrap label="شركة الطيران">
        <input
          value={value.airline ?? ""}
          onChange={(e) => set("airline", e.target.value)}
          placeholder="El Al / Turkish Airlines"
          className={inputClass}
        />
      </FieldWrap>
      <FieldWrap label="رقم الرحلة">
        <input
          value={value.flight_number ?? ""}
          onChange={(e) => set("flight_number", e.target.value)}
          dir="ltr"
          placeholder="LY 81"
          className={`${inputClass} text-left tabular-nums`}
        />
      </FieldWrap>
      <FieldWrap label="مدة الرحلة" full>
        <input
          value={value.duration ?? ""}
          onChange={(e) => set("duration", e.target.value)}
          placeholder="11 ساعة و 30 دقيقة"
          className={inputClass}
        />
      </FieldWrap>
      <FieldWrap label="ملاحظات / تذكير" full>
        <textarea
          value={value.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="مثال: اوصلي للمطار قبل 3 ساعات، احضّري الجواز والفيزا"
          className={inputClass}
        />
      </FieldWrap>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink/15 px-4 py-2.5 text-ink bg-white focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/50 transition-all";

function FieldWrap({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <label className="block text-xs font-bold text-ink/70">{label}</label>
      {children}
    </div>
  );
}
