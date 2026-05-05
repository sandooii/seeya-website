"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const TAGLINE = "catch flights, not feelings.";
const STORAGE_KEY = "seeya:loaded";

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem(STORAGE_KEY)) {
      setVisible(false);
      return;
    }

    document.documentElement.style.overflow = "hidden";

    const typeInterval = setInterval(() => {
      setTyped((t) => {
        if (t >= TAGLINE.length) {
          clearInterval(typeInterval);
          return t;
        }
        return t + 1;
      });
    }, 55);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, 2200);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(hideTimer);
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!visible && typeof window !== "undefined") {
      const t = setTimeout(() => {
        document.documentElement.style.overflow = "";
      }, 950);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const visibleText = TAGLINE.slice(0, typed);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          initial={{ y: 0 }}
          exit={{ y: "-101%" }}
          transition={{ duration: 0.95, ease: [0.85, 0, 0.15, 1] }}
          className="fixed inset-0 z-[300] grid place-items-center bg-coral text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.18),transparent_60%)]" />

          <div className="relative flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.55, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="flex"
            >
              <Image
                src="/logo-pink.png"
                alt="SeeYa"
                width={300}
                height={300}
                priority
                className="object-contain"
                style={{ width: "160px", height: "160px" }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              dir="ltr"
              className="font-display italic text-xl md:text-2xl tracking-wide tabular-nums min-h-[1.5em]"
            >
              {visibleText}
              <span className="inline-block w-[2px] h-[1em] -mb-[0.15em] bg-white/90 ml-0.5 animate-pulse" />
            </motion.p>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.4em] text-white/70">
            loading your trip
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
