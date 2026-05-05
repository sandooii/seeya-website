"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { faqs } from "./data";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 md:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-coral font-semibold tracking-widest text-sm uppercase">
            الأسئلة المتكررة
          </span>
          <h2
            data-gsap="title"
            className="mt-3 text-4xl md:text-6xl font-black text-ink leading-tight"
          >
            أسئلتكِ
          </h2>
        </motion.div>

        <div className="flex flex-col gap-4">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ y: 25, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`rounded-2xl border transition-colors overflow-hidden ${
                  isOpen
                    ? "bg-pale border-coral/40"
                    : "bg-white border-pale hover:border-coral/30"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-right"
                  aria-expanded={isOpen}
                >
                  <span className="text-base md:text-lg font-bold text-ink">
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                    className={`grid place-items-center w-9 h-9 rounded-full shrink-0 ${
                      isOpen ? "bg-coral text-white" : "bg-pale text-coral"
                    }`}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-6">
                        <p className="text-ink/75 leading-relaxed text-base">
                          {f.a}
                        </p>
                        {f.q === "شو سياسة الإلغاء؟" && (
                          <a
                            href="/cancellation-policy.pdf"
                            download="SeeYa-Cancellation-Policy.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm font-medium border rounded-full px-4 py-2 hover:bg-coral hover:text-white transition-colors"
                            style={{
                              color: "#F95C6B",
                              borderColor: "#F95C6B",
                            }}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden
                            >
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            حمّلي سياسة الإلغاء PDF
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
