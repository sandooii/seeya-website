"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Data ─────────────────────────────────────────────────────────────── */

type Flight = {
  destination: string;
  flight: string;
  date: string;
  status: string;
  statusColor: string;
};

const flights: Flight[] = [
  {
    destination: "THAILAND",
    flight: "SY-001",
    date: "06.2026",
    status: "BOARDING",
    statusColor: "#F95C6B",
  },
  {
    destination: "BANSKO",
    flight: "SY-002",
    date: "01.2025",
    status: "DEPARTED",
    statusColor: "#9aa1a8",
  },
  {
    destination: "ZANZIBAR",
    flight: "SY-003",
    date: "08.2026",
    status: "SOON",
    statusColor: "#f5ecd9",
  },
  {
    destination: "AMERICA",
    flight: "SY-004",
    date: "04.2027",
    status: "SOON",
    statusColor: "#f5ecd9",
  },
];

const WIDTHS = { destination: 8, flight: 6, date: 8, status: 8 } as const;
const CYCLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -";

function pad(s: string, len: number) {
  if (s.length >= len) return s.slice(0, len);
  return s + " ".repeat(len - s.length);
}

/* ─── Single split-flap cell ───────────────────────────────────────────── */

function FlapCell({ target, color }: { target: string; color: string }) {
  const [c, setC] = useState(target);
  const tickRef = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stagger = Math.random() * 220;
    const cycles = 6 + Math.floor(Math.random() * 5);
    let i = 0;

    const startTimer = setTimeout(() => {
      const step = () => {
        i++;
        tickRef.current += 1;
        setTick(tickRef.current);
        if (i >= cycles) {
          setC(target);
          if (intervalId) clearInterval(intervalId);
        } else {
          setC(CYCLE_CHARS[Math.floor(Math.random() * CYCLE_CHARS.length)]);
        }
      };
      intervalId = setInterval(step, 80);
    }, stagger);

    return () => {
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [target]);

  return (
    <span
      className="relative inline-grid place-items-center bg-black/55 border border-black/80 rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-2px_4px_rgba(0,0,0,0.6)]"
      style={{
        width: "1.05em",
        height: "1.5em",
        marginInline: "1px",
        perspective: "320px",
      }}
    >
      {/* horizontal split line */}
      <span className="absolute inset-x-[2px] top-1/2 h-px bg-black/80 z-10 pointer-events-none" />

      <AnimatePresence mode="sync" initial={false}>
        <motion.span
          key={`${tick}-${c}`}
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.08, ease: "easeOut" }}
          className="absolute inset-0 grid place-items-center font-mono font-black"
          style={{
            color,
            transformOrigin: "50% 50%",
            backfaceVisibility: "hidden",
            textShadow: "0 1px 0 rgba(0,0,0,0.4)",
          }}
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── Row of flap cells ────────────────────────────────────────────────── */

function FlapText({
  text,
  width,
  color = "#f5ecd9",
}: {
  text: string;
  width: number;
  color?: string;
}) {
  const padded = pad(text, width);
  return (
    <span className="inline-flex" dir="ltr">
      {padded.split("").map((ch, i) => (
        <FlapCell key={i} target={ch} color={color} />
      ))}
    </span>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */

export default function Hero() {
  // Board always starts at index 0 (Thailand · BOARDING)
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % flights.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const current = flights[idx];

  return (
    <>
    <WomenHero />
    <section
      className="relative h-[100svh] min-h-[680px] w-full overflow-hidden"
      style={{ backgroundColor: "#faf8f3" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 h-full flex flex-col items-center justify-center pt-20 pb-10 md:py-0">
        {/* Italic descriptor above the board */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[680px] mb-4 text-center text-sm italic leading-relaxed"
          style={{ color: "#9e6a70" }}
        >
          4 رحلات. كل 3 ثواني تتقلب لوحة المغادرة. وحدة منهم بتنادي عليكِ.
        </motion.p>

        <motion.div
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[680px] mx-auto rounded-2xl"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
        >
          <Board flight={current} index={idx} total={flights.length} />
        </motion.div>
      </div>
    </section>
    </>
  );
}

/* ─── Secondary hero — fullscreen video ───────────────────────────────── */

function WomenHero() {
  return (
    <section
      id="top"
      className="relative h-[100vh] w-full overflow-hidden text-white"
    >
      {/* Background video */}
      <video
        src="/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          show: {
            transition: { staggerChildren: 0.15, delayChildren: 0.1 },
          },
        }}
        className="relative z-10 h-full max-w-5xl mx-auto px-5 md:px-8 flex flex-col items-center justify-end pb-24 md:pb-32 text-center"
      >
        <motion.h2
          variants={{
            hidden: { y: 32, opacity: 0 },
            show: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl md:text-5xl lg:text-7xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.45)]"
        >
          رحلات صُممت لمن تعرف قيمة نفسها
        </motion.h2>

        <motion.p
          variants={{
            hidden: { y: 22, opacity: 0 },
            show: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          dir="ltr"
          className="mt-5 font-display italic text-xl md:text-3xl text-coral-soft tracking-tight"
        >
          catch flights, not feelings.
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ─── The board ────────────────────────────────────────────────────────── */

function Board({
  flight,
  index,
  total,
}: {
  flight: Flight;
  index: number;
  total: number;
}) {
  return (
    <div
      dir="ltr"
      className="relative bg-[#1a1410] rounded-2xl border border-[#2c211a] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.04)] p-5 md:p-7"
    >
      {/* board screws / corner accents */}
      <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-black/60 ring-1 ring-white/5" />
      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-black/60 ring-1 ring-white/5" />
      <span className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-black/60 ring-1 ring-white/5" />
      <span className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-black/60 ring-1 ring-white/5" />

      {/* board header */}
      <div className="flex items-center justify-between text-[10px] tracking-[0.4em] font-bold text-white/40 mb-4 px-1">
        <span>SEEYA · DEPARTURES</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
          LIVE
        </span>
      </div>

      {/* rows */}
      <div className="space-y-3 md:space-y-4">
        <Row label="DESTINATION">
          <FlapText
            text={flight.destination}
            width={WIDTHS.destination}
            color="#f5ecd9"
          />
        </Row>
        <Row label="FLIGHT">
          <FlapText
            text={flight.flight}
            width={WIDTHS.flight}
            color="#f5ecd9"
          />
        </Row>
        <Row label="DATE">
          <FlapText text={flight.date} width={WIDTHS.date} color="#f5ecd9" />
        </Row>
        <Row label="STATUS">
          <FlapText
            text={flight.status}
            width={WIDTHS.status}
            color={flight.statusColor}
          />
        </Row>
      </div>

      {/* progress dots */}
      <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-white/5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === index ? "w-6 bg-coral" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 md:gap-5">
      <span className="text-[10px] md:text-xs tracking-[0.3em] font-bold text-white/40 shrink-0 w-20 md:w-28">
        {label}
      </span>
      <div className="text-2xl md:text-4xl leading-none">{children}</div>
    </div>
  );
}

