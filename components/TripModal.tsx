"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  Check,
  Download,
} from "lucide-react";
import { formatPrice, type Trip } from "./data";

const statusColor: Record<Trip["status"], string> = {
  live: "bg-emerald-500 text-white",
  open: "bg-coral text-white",
  soon: "bg-amber-400 text-ink",
  completed: "bg-ink/70 text-white",
};

const THAILAND_ACTIVITIES = [
  "🚢 إبحار في خليج جيمس بوند — يخت خاص",
  "🏝️ جزر في في و Maya Bay — يخت فاخر",
  "🌊 أنداماندا — مدينة الملاهي المائية",
  "🏛️ City Tour — البلدة القديمة + معبد تشالونغ",
  "✨ عرض فانتازيا — ليلة السحر",
];

const THAILAND_ITINERARY_SUMMARY = [
  "5 فعاليات منظمة",
  "4 أيام حرة للراحة",
  "دعم ومرافقة 24/7",
];

const THAILAND_FLIGHT_INFO = [
  "✈️ الإقلاع: تل أبيب 26.06 — الساعة 00:40",
  "✈️ الوصول: بوكيت 26.06 — الساعة 20:05",
  "🧳 الأمتعة: ترولي 8 كيلو + حقيبة 23 كيلو",
];

type Props = {
  trip: Trip | null;
  onClose: () => void;
};

function WhatsAppGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.855L.057 23.882l6.204-1.427A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.378l-.36-.214-3.732.858.882-3.63-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106c5.421 0 9.894 4.474 9.894 9.894 0 5.421-4.473 9.894-9.894 9.894z" />
    </svg>
  );
}

export default function TripModal({ trip, onClose }: Props) {
  useEffect(() => {
    if (!trip) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [trip, onClose]);

  const priceLabel = trip ? formatPrice(trip) : null;
  const isThailand = trip?.id === "thailand";

  return (
    <AnimatePresence>
      {trip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          data-lenis-prevent="true"
          className="fixed inset-0 z-[80] bg-ink/70 backdrop-blur-md grid place-items-end md:place-items-center p-0 md:p-6"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            data-lenis-prevent="true"
            className="relative bg-white w-full md:max-w-4xl md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.3)]"
            style={{ maxHeight: "92vh" }}
          >
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute top-4 right-4 z-10 grid place-items-center w-10 h-10 rounded-full bg-white/95 backdrop-blur shadow text-ink hover:bg-white"
            >
              <X size={20} />
            </button>

            {/* A) HEADER — trip name + dates + badge */}
            <div className="relative h-56 md:h-72 shrink-0">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${trip.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute bottom-5 right-5 left-5 text-white">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statusColor[trip.status]}`}
                >
                  {trip.badge}
                </span>
                <h3 className="mt-3 text-3xl md:text-5xl font-black">
                  {trip.name}
                </h3>
              </div>
            </div>

            {isThailand ? (
              <ThailandBody
                trip={trip}
                priceLabel={priceLabel}
              />
            ) : (
              <DefaultBody trip={trip} priceLabel={priceLabel} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Thailand body ─────────────────────────────────────────────────────── */

function ThailandBody({
  trip,
  priceLabel,
}: {
  trip: Trip;
  priceLabel: string | null;
}) {
  return (
    <div
      data-lenis-prevent="true"
      className="overflow-y-auto overscroll-contain px-6 md:px-10 py-7"
      style={{ maxHeight: "85vh" }}
    >
      {/* B) PRICE BLOCK */}
      <section className="mb-8 text-right w-full">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: "500",
              padding: "4px 12px",
              borderRadius: "999px",
              backgroundColor: "rgba(249,92,107,0.1)",
              color: "#F95C6B",
              border: "1px solid rgba(249,92,107,0.3)",
            }}
          >
            26.06.2026 – 06.07.2026
          </span>
        </div>

        {priceLabel && (
          <div
            className="text-4xl md:text-5xl font-black"
            dir="ltr"
            style={{ color: "#F95C6B" }}
          >
            {priceLabel}
          </div>
        )}
        {trip.priceSubtitle && (
          <p className="mt-2 text-sm md:text-base text-ink/60">
            {trip.priceSubtitle}
          </p>
        )}
        {trip.deposit && (
          <span
            className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: "#F95C6B" }}
          >
            {trip.deposit}
          </span>
        )}
        {trip.deadline && (
          <p className="mt-3 text-sm text-ink/55 font-medium">
            {trip.deadline}
          </p>
        )}
      </section>

      {/* C) INCLUDES LIST */}
      <Section title="شو بشمل السعر">
        <ul className="space-y-2.5">
          {trip.includes.map((x, i) => (
            <li key={i} className="flex items-start gap-2.5 text-ink/85">
              <span className="grid place-items-center w-5 h-5 rounded-full bg-coral/15 text-coral mt-0.5 shrink-0">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="text-sm leading-relaxed">{x}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* D) ACTIVITIES */}
      <Section title="الفعاليات المنظمة">
        <ol className="space-y-2.5 list-none">
          {THAILAND_ACTIVITIES.map((act, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-ink/85"
            >
              <span
                className="grid place-items-center w-6 h-6 rounded-full text-white text-xs font-black shrink-0"
                style={{ backgroundColor: "#F95C6B" }}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{act}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* E) ITINERARY SUMMARY */}
      <Section title="11 يوم مليانة حياة">
        <ul className="space-y-2.5">
          {THAILAND_ITINERARY_SUMMARY.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-ink/85"
            >
              <span className="grid place-items-center w-5 h-5 rounded-full bg-coral/15 text-coral mt-0.5 shrink-0">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="text-sm leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* F) FLIGHT INFO */}
      <Section title="تفاصيل الطيران">
        <ul className="space-y-2.5">
          {THAILAND_FLIGHT_INFO.map((line, i) => (
            <li
              key={i}
              className="text-sm leading-relaxed text-ink/85 bg-pale rounded-2xl px-4 py-2.5"
            >
              {line}
            </li>
          ))}
        </ul>
      </Section>

      {/* G) BUTTONS */}
      <div className="flex flex-col gap-3 mt-8">
        <a
          href="https://wa.me/9720544880123"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 py-4 rounded-full font-bold text-white text-base transition-all duration-300"
          style={{ backgroundColor: "#F95C6B" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#25D366";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#F95C6B";
          }}
        >
          <WhatsAppGlyph />
          احجزي مكانكِ على واتساب
        </a>

        {trip.pdf && (
          <a
            href={trip.pdf}
            download="SeeYa-Thailand-2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 font-bold border bg-transparent transition-colors hover:bg-coral hover:text-white"
            style={{
              borderColor: "#F95C6B",
              borderWidth: "1px",
              color: "#F95C6B",
            }}
          >
            <Download size={16} />
            حمّلي برنامج الرحلة PDF
            <span>↓</span>
          </a>
        )}

        <a
          href="/cancellation-policy.pdf"
          download="SeeYa-Cancellation-Policy.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium border border-white/20 text-white/70 hover:border-white/40 hover:text-white transition-colors"
        >
          سياسة الإلغاء PDF ↓
        </a>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h4 className="text-2xl font-black mb-4 text-ink">{title}</h4>
      {children}
    </section>
  );
}

/* ─── Default body (non-Thailand trips) ─────────────────────────────────── */

function DefaultBody({
  trip,
  priceLabel,
}: {
  trip: Trip;
  priceLabel: string | null;
}) {
  return (
    <>
      <div
        data-lenis-prevent="true"
        className="overflow-y-auto overscroll-contain px-6 md:px-10 py-7"
        style={{ maxHeight: "85vh" }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-7">
          {[
            { icon: Calendar, label: trip.month },
            { icon: Clock, label: trip.duration },
            {
              icon: Users,
              label: trip.spots > 0 ? `${trip.spots} مقاعد متبقية` : "خلصت",
            },
            { icon: MapPin, label: "مرشدة بنت" },
          ].map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-pale rounded-2xl p-3"
            >
              <b.icon size={18} className="text-coral shrink-0" />
              <span className="text-sm font-semibold text-ink">{b.label}</span>
            </div>
          ))}
        </div>

        <p className="text-lg text-ink/80 leading-relaxed mb-8">
          {trip.blurb}
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="text-2xl font-black mb-4 text-ink">
              البرنامج اليومي
            </h4>
            <ol className="space-y-4 relative">
              <span className="absolute right-3 top-2 bottom-2 w-px bg-coral/25" />
              {trip.itinerary.map((it, i) => (
                <li key={i} className="relative pr-9">
                  <span className="absolute right-0 top-1 grid place-items-center w-6 h-6 rounded-full bg-coral text-white text-xs font-black">
                    {i + 1}
                  </span>
                  <div className="text-coral text-xs font-bold tracking-widest mb-0.5">
                    {it.day}
                  </div>
                  <div className="font-bold text-ink">{it.title}</div>
                  <p className="text-sm text-ink/70 mt-1">{it.desc}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 className="text-2xl font-black mb-4 text-ink">شو بشمل السعر</h4>
            <ul className="space-y-2.5">
              {trip.includes.map((x, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-ink/85"
                >
                  <span className="grid place-items-center w-5 h-5 rounded-full bg-coral/15 text-coral mt-0.5 shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed">{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-pale bg-cream px-6 md:px-10 py-5 flex items-center justify-between gap-4 shrink-0 flex-wrap">
        {priceLabel && (
          <div>
            <div className="text-xs text-ink/60 font-medium">
              السعر الكلي للبنت
            </div>
            <div
              className="text-3xl md:text-4xl font-black"
              dir="ltr"
              style={{ color: "#F95C6B" }}
            >
              {priceLabel}
            </div>
            {trip.priceSubtitle && (
              <p className="mt-1 text-xs text-ink/55">{trip.priceSubtitle}</p>
            )}
          </div>
        )}
        <motion.button
          disabled={trip.status === "completed"}
          className="inline-flex items-center gap-2 px-6 md:px-8 py-3.5 rounded-full bg-coral text-white font-bold shadow-coral hover:bg-coral-dark transition-colors disabled:bg-ink/30 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {trip.status === "completed" ? "انتهت الرحلة" : "احجزي مكانكِ"}
          {trip.status !== "completed" && <span>←</span>}
        </motion.button>
      </div>
    </>
  );
}
