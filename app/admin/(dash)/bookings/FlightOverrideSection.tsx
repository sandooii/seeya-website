"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import type {
  BookingFlightOverride,
  FlightInfo,
} from "@/lib/supabase/types";
import FlightFieldsEditor from "@/components/admin/FlightFieldsEditor";

/**
 * Optional per-booking flight override editor.
 *
 * Renders as a collapsible <details> section so the booking form stays
 * uncluttered for the common case (everyone on the trip-default flight).
 * State is local — we serialize to a hidden `flight_override` input as
 * JSON so the booking server action can `JSON.parse` it.
 *
 * Empty objects are sent as `null` (the server treats this as "no override").
 */
export default function FlightOverrideSection({
  initial,
}: {
  initial: BookingFlightOverride | null;
}) {
  const [outbound, setOutbound] = useState<FlightInfo>(initial?.outbound ?? {});
  const [returnFlight, setReturnFlight] = useState<FlightInfo>(
    initial?.return_flight ?? {},
  );

  const hasAny =
    Object.values(outbound).some(Boolean) ||
    Object.values(returnFlight).some(Boolean);

  // Build the payload — only include sides that have at least one filled field.
  const payload: BookingFlightOverride | null = (() => {
    const out: BookingFlightOverride = {};
    if (Object.values(outbound).some(Boolean)) out.outbound = outbound;
    if (Object.values(returnFlight).some(Boolean))
      out.return_flight = returnFlight;
    return Object.keys(out).length > 0 ? out : null;
  })();

  return (
    <section className="bg-white rounded-3xl border border-ink/5 p-6 md:p-8">
      <input
        type="hidden"
        name="flight_override"
        value={payload ? JSON.stringify(payload) : ""}
      />

      <details open={hasAny} className="group">
        <summary className="flex items-center gap-3 cursor-pointer list-none">
          <span className="w-10 h-10 rounded-2xl bg-coral/10 text-coral grid place-items-center shrink-0">
            <Plane size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-ink">
              طيران مختلف لهاي البنت؟
            </h2>
            <p className="text-ink/55 text-sm mt-0.5">
              اتركيه فاضي — راح تشوف طيران الرحلة الافتراضي. عبّيه فقط إذا
              هاي البنت ضمّت لاحقاً وطيرانها مختلف عن باقي المجموعة.
            </p>
          </div>
          <span className="text-ink/30 text-xs group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>

        <div className="mt-6 space-y-6">
          {/* Outbound */}
          <div className="rounded-2xl border border-ink/8 p-5">
            <h3 className="font-bold text-ink mb-4 inline-flex items-center gap-2">
              🛫 طيران الذهاب
            </h3>
            <FlightFieldsEditor value={outbound} onChange={setOutbound} />
          </div>

          {/* Return */}
          <div className="rounded-2xl border border-ink/8 p-5">
            <h3 className="font-bold text-ink mb-4 inline-flex items-center gap-2">
              🛬 طيران الرجعة
            </h3>
            <FlightFieldsEditor
              value={returnFlight}
              onChange={setReturnFlight}
            />
          </div>

          {hasAny && (
            <button
              type="button"
              onClick={() => {
                setOutbound({});
                setReturnFlight({});
              }}
              className="text-sm font-bold text-red-600 hover:underline"
            >
              مسح كل بيانات الـ override (الرجوع للطيران الافتراضي)
            </button>
          )}
        </div>
      </details>
    </section>
  );
}
