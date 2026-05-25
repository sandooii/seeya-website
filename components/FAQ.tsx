"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageCircle } from "lucide-react";
import { faqs } from "./data";
import { waLink } from "@/lib/contact";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 md:py-32 bg-white overflow-hidden">
      {/* Decorative passport-stamp circles in the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-[0.07]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #F95C6B 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -right-16 w-96 h-96 rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(circle at 60% 60%, #F95C6B 0%, transparent 70%)",
        }}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute top-16 right-8 opacity-[0.08]"
        width="120"
        height="120"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#F95C6B"
        strokeWidth="1.5"
      >
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="32" strokeDasharray="2 3" />
        <text
          x="50"
          y="44"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#F95C6B"
          stroke="none"
          letterSpacing="1.2"
        >
          SEEYA
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          fontSize="6"
          fontWeight="700"
          fill="#F95C6B"
          stroke="none"
          letterSpacing="1.5"
        >
          BOARDING
        </text>
      </svg>
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-24 left-10 opacity-[0.06] -rotate-12"
        width="140"
        height="140"
        viewBox="0 0 100 100"
        fill="none"
        stroke="#F95C6B"
        strokeWidth="1.5"
      >
        <rect x="14" y="14" width="72" height="72" rx="4" />
        <rect x="20" y="20" width="60" height="60" rx="2" strokeDasharray="2 3" />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fontSize="10"
          fontWeight="800"
          fill="#F95C6B"
          stroke="none"
          letterSpacing="2"
        >
          ASK ME
        </text>
      </svg>

      <div className="relative max-w-4xl mx-auto px-5 md:px-8">
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

        {/* "Still have questions?" CTA */}
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mt-12 md:mt-14 rounded-2xl bg-gradient-to-br from-coral/10 via-pale to-white border border-coral/20 p-7 md:p-9 text-center"
        >
          <p className="text-ink/70 text-sm md:text-base">
            أي سؤال لسه ببالكِ؟
          </p>
          <h3 className="mt-2 text-2xl md:text-3xl font-black text-ink">
            كلميني على الواتساب 💬
          </h3>
          <p className="mt-2 text-ink/60 text-sm md:text-base max-w-md mx-auto">
            رح ارد عليكِ خلال ساعات قليلة وبجاوبك على كل تفصيل.
          </p>
          <a
            href={waLink("مرحبا، عندي سؤال عن رحلاتكم")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 bg-coral text-white px-7 py-3 rounded-full text-sm md:text-base font-bold hover:brightness-110 transition-all shadow-[0_8px_22px_-6px_rgba(255,90,74,0.55)]"
          >
            <MessageCircle size={18} />
            راسليني على الواتساب
          </a>
        </motion.div>
      </div>
    </section>
  );
}
