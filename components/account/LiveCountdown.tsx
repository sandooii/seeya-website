"use client";

import { useEffect, useState } from "react";

type Tick = {
  d: number;
  h: number;
  m: number;
  s: number;
  gone: boolean;
};

function computeTick(target: number): Tick {
  const diff = target - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, gone: true };
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { d, h, m, s, gone: false };
}

/**
 * Live ticking countdown to a trip's departure moment. The parent
 * computes the target via `tripDepartureMs()` (start_date + flight
 * departure_time) so every page sharing the same trip ticks to the
 * same second.
 */
export default function LiveCountdown({ targetMs }: { targetMs: number }) {
  const [tick, setTick] = useState<Tick>(() => computeTick(targetMs));

  useEffect(() => {
    const id = setInterval(() => setTick(computeTick(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (tick.gone) {
    return (
      <div className="text-center md:text-left bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl px-6 py-4">
        <div className="text-3xl md:text-4xl font-black leading-none">
          سفرك اليوم 🎉
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/80 mt-1">
          أتمنالك رحلة لا تنسى
        </div>
      </div>
    );
  }

  return (
    <div className="text-center md:text-left bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl px-5 py-4">
      <div
        className="flex items-baseline gap-2 md:gap-3 justify-center md:justify-start tabular-nums"
        dir="ltr"
      >
        <Cell value={tick.d} label="أيام" />
        <Separator />
        <Cell value={tick.h} label="ساعة" pad />
        <Separator />
        <Cell value={tick.m} label="دقيقة" pad />
        <Separator />
        <Cell value={tick.s} label="ثانية" pad highlight />
      </div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/80 mt-2 text-center md:text-right">
        على سفرك ✈️
      </div>
    </div>
  );
}

function Cell({
  value,
  label,
  pad,
  highlight,
}: {
  value: number;
  label: string;
  pad?: boolean;
  highlight?: boolean;
}) {
  const text = pad ? String(value).padStart(2, "0") : String(value);
  return (
    <div className="flex flex-col items-center">
      <span
        className={`text-3xl md:text-4xl font-black leading-none ${highlight ? "text-coral" : ""}`}
      >
        {text}
      </span>
      <span
        className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-white/70 mt-1"
        dir="rtl"
      >
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span className="text-2xl md:text-3xl font-black text-white/40 leading-none self-start mt-1">
      :
    </span>
  );
}
