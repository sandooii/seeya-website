"use client";

import { useEffect, useState } from "react";

type Tick = {
  d: number;
  h: number;
  m: number;
  s: number;
  gone: boolean;
};

type Variant = "dark" | "light";

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
 *
 * `variant`:
 *   - "dark"  — translucent white-on-dark, for image overlays
 *   - "light" — coral-on-white, for white card backgrounds
 */
export default function LiveCountdown({
  targetMs,
  variant = "dark",
  compact = false,
}: {
  targetMs: number;
  variant?: Variant;
  /** Compact mode shrinks padding + digit size for tight hero placements. */
  compact?: boolean;
}) {
  const [tick, setTick] = useState<Tick>(() => computeTick(targetMs));

  useEffect(() => {
    const id = setInterval(() => setTick(computeTick(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  const styles =
    variant === "light"
      ? {
          wrapper:
            "bg-gradient-to-br from-coral/10 via-coral/5 to-white border border-coral/20",
          digit: "text-ink",
          highlight: "text-coral",
          label: "text-ink/55",
          tagline: "text-ink/60",
          separator: "text-coral/35",
        }
      : {
          wrapper: "bg-white/15 backdrop-blur-lg border border-white/25",
          digit: "text-white",
          highlight: "text-coral",
          label: "text-white/70",
          tagline: "text-white/80",
          separator: "text-white/40",
        };

  const padding = compact ? "px-3 py-2.5 md:px-5 md:py-4" : "px-5 py-4";
  const digitSize = compact
    ? "text-2xl md:text-4xl"
    : "text-3xl md:text-4xl";
  const sepSize = compact ? "text-xl md:text-3xl" : "text-2xl md:text-3xl";
  const labelSize = compact ? "text-[9px] md:text-xs" : "text-[10px] md:text-xs";
  const taglineSize = compact ? "text-[10px] md:text-xs" : "text-xs";
  const taglineMt = compact ? "mt-1.5 md:mt-2" : "mt-2";

  if (tick.gone) {
    return (
      <div className={`text-center rounded-2xl ${padding} ${styles.wrapper}`}>
        <div className={`${digitSize} font-black leading-none ${styles.digit}`}>
          سفرك اليوم 🎉
        </div>
        <div className={`${taglineSize} mt-1 ${styles.tagline}`}>
          أتمنالك رحلة لا تنسى
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl ${padding} ${styles.wrapper}`}>
      <div
        className="flex items-baseline gap-1.5 md:gap-3 justify-center tabular-nums"
        dir="ltr"
      >
        <Cell
          value={tick.d}
          label="أيام"
          styles={styles}
          digitSize={digitSize}
          labelSize={labelSize}
        />
        <Separator styles={styles} sepSize={sepSize} />
        <Cell
          value={tick.h}
          label="ساعة"
          pad
          styles={styles}
          digitSize={digitSize}
          labelSize={labelSize}
        />
        <Separator styles={styles} sepSize={sepSize} />
        <Cell
          value={tick.m}
          label="دقيقة"
          pad
          styles={styles}
          digitSize={digitSize}
          labelSize={labelSize}
        />
        <Separator styles={styles} sepSize={sepSize} />
        <Cell
          value={tick.s}
          label="ثانية"
          pad
          highlight
          styles={styles}
          digitSize={digitSize}
          labelSize={labelSize}
        />
      </div>
      <div className={`${taglineSize} ${taglineMt} text-center ${styles.tagline}`}>
        على سفرك ✈️
      </div>
    </div>
  );
}

type Styles = {
  wrapper: string;
  digit: string;
  highlight: string;
  label: string;
  tagline: string;
  separator: string;
};

function Cell({
  value,
  label,
  pad,
  highlight,
  styles,
  digitSize,
  labelSize,
}: {
  value: number;
  label: string;
  pad?: boolean;
  highlight?: boolean;
  styles: Styles;
  digitSize: string;
  labelSize: string;
}) {
  const text = pad ? String(value).padStart(2, "0") : String(value);
  return (
    <div className="flex flex-col items-center">
      <span
        className={`${digitSize} font-black leading-none ${
          highlight ? styles.highlight : styles.digit
        }`}
      >
        {text}
      </span>
      <span
        className={`${labelSize} mt-1 font-semibold ${styles.label}`}
        dir="rtl"
      >
        {label}
      </span>
    </div>
  );
}

function Separator({
  styles,
  sepSize,
}: {
  styles: Styles;
  sepSize: string;
}) {
  return (
    <span
      className={`${sepSize} font-black leading-none self-start mt-1 ${styles.separator}`}
    >
      :
    </span>
  );
}
