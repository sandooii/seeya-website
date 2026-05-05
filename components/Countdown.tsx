"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles } from "lucide-react";

const TARGET = new Date("2026-06-26T00:00:00").getTime();

type Tick = { d: number; h: number; m: number; s: number; gone: boolean };

function diff(): Tick {
  const ms = TARGET - Date.now();
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, gone: true };
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms / 3_600_000) % 24);
  const m = Math.floor((ms / 60_000) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return { d, h, m, s, gone: false };
}

const labels: Record<keyof Omit<Tick, "gone">, string> = {
  d: "يوم",
  h: "ساعة",
  m: "دقيقة",
  s: "ثانية",
};

const dots = [
  { size: 6, top: "12%", left: "8%", duration: 8, delay: 0 },
  { size: 10, top: "22%", left: "78%", duration: 11, delay: 1.2 },
  { size: 4, top: "55%", left: "15%", duration: 6, delay: 0.4 },
  { size: 8, top: "70%", left: "85%", duration: 9, delay: 2 },
  { size: 12, top: "82%", left: "32%", duration: 12, delay: 0.8 },
  { size: 5, top: "38%", left: "55%", duration: 7, delay: 1.6 },
];

const TOTAL_SEATS = 10;
const BOOKED = 3;
const AVAILABLE = TOTAL_SEATS - BOOKED;

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {n}
    </span>
  );
}

function SeatsVisualizer() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mt-8 mx-auto max-w-md"
      dir="ltr"
      style={{
        backgroundColor: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "20px",
        padding: "20px 28px",
        marginBottom: "24px",
      }}
    >
      {/* Top rule */}
      <div
        aria-hidden
        className="h-px"
        style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
      />

      {/* Bars row — booked on the visual left, available on the visual right */}
      <div className="flex items-center gap-4 py-4">
        {/* Booked bars (7) */}
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: BOOKED }).map((_, i) => (
            <div
              key={`b-${i}`}
              className="flex-1 overflow-hidden"
              style={{ height: "8px", borderRadius: "4px" }}
            >
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: "100%", opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor: "white",
                }}
              />
            </div>
          ))}
        </div>

        {/* Available bars (3) */}
        <div className="flex gap-1.5" style={{ flexBasis: "30%" }}>
          {Array.from({ length: AVAILABLE }).map((_, i) => (
            <motion.div
              key={`a-${i}`}
              animate={{ opacity: [0.25, 0.7, 0.25] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
              className="flex-1"
              style={{
                height: "8px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.5)",
                backgroundColor: "transparent",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom rule */}
      <div
        aria-hidden
        className="h-px"
        style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
      />

      {/* Labels — booked label under the booked column, baqi under the available column */}
      <div className="flex items-center justify-between mt-3 text-white">
        <span dir="rtl" className="text-sm font-bold">
          <CountUp to={BOOKED} /> مسافرات سجّلن
        </span>
        <motion.span
          dir="rtl"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm font-medium text-white/80"
        >
          {AVAILABLE} باقي
        </motion.span>
      </div>
    </motion.div>
  );
}

function PalmTree() {
  return (
    <svg
      width="36"
      height="44"
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="inline-block align-middle drop-shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
    >
      <path
        d="M18 44 C18 44 16 28 15 20"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M15 20 C10 12 2 10 0 4 C6 6 13 12 15 20Z" fill="white" />
      <path
        d="M15 20 C12 10 4 4 8 0 C12 5 14 13 15 20Z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M15 20 C17 10 15 2 20 0 C19 8 17 14 15 20Z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M15 20 C20 13 28 10 32 4 C27 9 20 14 15 20Z"
        fill="white"
        opacity="0.9"
      />
      <path
        d="M15 20 C22 15 30 16 34 12 C28 16 20 18 15 20Z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  );
}

export default function Countdown() {
  const [t, setT] = useState<Tick>({ d: 0, h: 0, m: 0, s: 0, gone: false });

  useEffect(() => {
    setT(diff());
    const id = setInterval(() => setT(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #e8445a 0%, #F95C6B 50%, #ff8b96 100%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.16),transparent_55%)]" />

      {/* Ambient floating dots */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        {dots.map((d, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              top: d.top,
              left: d.left,
              width: d.size,
              height: d.size,
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
            animate={{ y: [0, -22, 0], opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: d.duration,
              delay: d.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 text-white text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30"
        >
          <Sparkles size={16} />
          الرحلة القادمة
        </motion.div>

        {/* Palm sits as a sibling so the GSAP title splitter (data-gsap="title") doesn't wipe it */}
        <div className="mt-5 flex items-center justify-center gap-3 md:gap-4 flex-wrap">
          <h2
            data-gsap="title"
            className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight"
          >
            رحلة تايلاند 2026
          </h2>
          <PalmTree />
        </div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-3 text-lg md:text-2xl text-white/90 max-w-2xl mx-auto"
        >
          <span dir="ltr" lang="en" className="tabular-nums">
            26.06.2026 – 06.07.2026
          </span>{" "}
          · باقي أماكن محدودة
        </motion.p>

        <div
          className="mt-10 grid grid-cols-4 gap-3 md:gap-5 max-w-3xl mx-auto"
          dir="rtl"
        >
          {(["d", "h", "m", "s"] as const).map((k, i) => (
            <motion.div
              key={k}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.25)]"
            >
              <div
                dir="ltr"
                lang="en"
                className="text-3xl md:text-5xl lg:text-6xl font-black tabular-nums leading-none"
              >
                {String(t[k]).padStart(2, "0")}
              </div>
              <div className="mt-2 text-xs md:text-sm uppercase tracking-[0.2em] text-white/85 font-semibold">
                {labels[k]}
              </div>
            </motion.div>
          ))}
        </div>

        <SeatsVisualizer />

        <motion.button
          type="button"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          onClick={() => {
            window.dispatchEvent(new CustomEvent("openThailandModal"));
          }}
          className="group mt-2 inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-coral-dark font-bold shadow-[0_18px_50px_-15px_rgba(0,0,0,0.4)] hover:scale-[1.04] active:scale-[0.97] transition-transform"
        >
          تفاصيل الرحلة
          <span className="transition-transform group-hover:-translate-x-1">←</span>
        </motion.button>
      </div>
    </section>
  );
}
