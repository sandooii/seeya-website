"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { trips, formatPrice, type Trip } from "./data";
import TripModal from "./TripModal";

const statusColor: Record<Trip["status"], string> = {
  live: "bg-emerald-500 text-white",
  open: "bg-coral text-white",
  soon: "bg-amber-400 text-ink",
  completed: "bg-ink/75 text-white",
};

const pulse: Record<Trip["status"], boolean> = {
  live: true,
  open: false,
  soon: false,
  completed: false,
};

const WAITLIST_HREF =
  "https://wa.me/9720544880123?text=أريد الانضمام لقائمة الانتظار";

export default function Trips() {
  const [active, setActive] = useState<Trip | null>(null);

  useEffect(() => {
    const onOpenThailand = () => {
      const thailand = trips.find((t) => t.id === "thailand");
      if (!thailand) return;
      // Scroll the section into view, then open the modal so the user
      // sees the section behind the modal when they close it.
      document
        .getElementById("trips")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(thailand);
    };
    window.addEventListener("openThailandModal", onOpenThailand);
    return () =>
      window.removeEventListener("openThailandModal", onOpenThailand);
  }, []);

  return (
    <section id="trips" className="relative pt-20 md:pt-28 pb-0 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <motion.div
          initial={{ y: 25, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 md:mb-16"
        >
          <h2
            data-gsap="title"
            className="text-5xl md:text-7xl font-black text-ink leading-[1.05]"
          >
            الوجهات
          </h2>
          <p className="mt-3 text-ink/65 text-lg md:text-xl">
            رحلتكِ بتنادي عليكِ
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onOpen={() => setActive(trip)}
            />
          ))}
        </div>
      </div>

      <TripModal trip={active} onClose={() => setActive(null)} />
    </section>
  );
}

function TripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const clickable = trip.status === "live" || trip.status === "open";
  const priceLabel = formatPrice(trip);

  const cardClasses = `group relative overflow-hidden rounded-3xl bg-ink text-white text-right min-h-[300px] flex flex-col ${
    clickable
      ? "cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-coral/40 ring-offset-2"
      : "cursor-default"
  }`;

  const imageArea = (
    <div className="relative aspect-[4/3] md:aspect-[5/4] overflow-hidden">
      <div
        className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          clickable ? "group-hover:scale-110" : ""
        }`}
        style={{ backgroundImage: `url(${trip.image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusColor[trip.status]}`}
        >
          {pulse[trip.status] && (
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-white animate-ping" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-white" />
            </span>
          )}
          {trip.badge}
        </span>
      </div>

      {priceLabel && (
        <div
          className="absolute top-5 left-5 bg-white/95 backdrop-blur text-ink px-3 py-1.5 rounded-full text-xs font-bold tracking-widest z-20"
          dir="ltr"
        >
          {priceLabel}
        </div>
      )}

      <div className="absolute bottom-0 right-0 left-0 p-6 md:p-7 z-10">
        <h3 className="text-3xl md:text-4xl font-black drop-shadow-lg">
          {trip.name}
        </h3>
        <p
          className="text-white/70 text-xs tracking-widest uppercase mt-1"
          dir="ltr"
        >
          {trip.country}
        </p>
      </div>

      {/* Status overlay — completed */}
      {trip.status === "completed" && (
        <div
          className="absolute inset-0 z-20 grid place-items-center pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          />
          <span
            className="relative text-white text-2xl italic font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            انتهت الرحلة
          </span>
        </div>
      )}

      {/* Status overlay — soon */}
      {trip.status === "soon" && (
        <div
          className="absolute inset-0 z-20 grid place-items-center pointer-events-none"
          aria-hidden
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          />
          <span className="relative text-white text-2xl italic font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            قريباً ✦
          </span>
        </div>
      )}

      {clickable && (
        <div className="absolute inset-0 bg-coral/0 group-hover:bg-coral/15 transition-colors duration-500" />
      )}
    </div>
  );

  const infoRow = (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <span className="inline-flex items-center gap-1.5">
        <Calendar size={16} className="text-coral" />
        {trip.month}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock size={16} className="text-coral" />
        {trip.duration}
      </span>
      {trip.spots > 0 && (
        <span className="inline-flex items-center gap-1.5">
          <Users size={16} className="text-coral" />
          {trip.spots} مقاعد
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <button
        type="button"
        data-gsap="trip-card"
        onClick={onOpen}
        className={cardClasses}
      >
        {imageArea}
        <div className="bg-white text-ink p-5 md:p-7 flex items-center justify-between gap-4 flex-wrap">
          {infoRow}
          <span className="inline-flex items-center gap-2 text-coral font-bold text-sm group-hover:gap-3 transition-all">
            <MapPin size={16} />
            التفاصيل
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>
          </span>
        </div>
      </button>
    );
  }

  // Non-clickable card (completed / soon)
  return (
    <article data-gsap="trip-card" className={cardClasses}>
      {imageArea}
      <div className="bg-white text-ink p-5 md:p-7 flex flex-col gap-4">
        {infoRow}
        {trip.status === "soon" && (
          <a
            href={WAITLIST_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-bold transition-colors hover:brightness-110"
            style={{ backgroundColor: "#F95C6B" }}
          >
            🔔 أبلغيني لما يفتح التسجيل
          </a>
        )}
      </div>
    </article>
  );
}
