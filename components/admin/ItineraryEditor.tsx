"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { TripItineraryItem } from "@/lib/supabase/types";

/**
 * Friendly editor for a trip's day-by-day itinerary. Replaces the
 * raw JSON textarea in TripForm. Emits the same shape (an array of
 * { day, title, desc }) via a hidden `itinerary` field as JSON so
 * the server action keeps its existing parser.
 *
 * The editor itself is purely client-side state — we only stringify
 * to the hidden input on each change.
 */
export default function ItineraryEditor({
  initial,
}: {
  initial: TripItineraryItem[];
}) {
  const [items, setItems] = useState<TripItineraryItem[]>(
    initial && initial.length > 0
      ? initial
      : [{ day: "", title: "", desc: "" }],
  );

  function update(idx: number, patch: Partial<TripItineraryItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }
  function add() {
    setItems((prev) => [...prev, { day: "", title: "", desc: "" }]);
  }
  function remove(idx: number) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  }
  function move(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  // Strip empty rows before serializing so we don't save junk.
  const cleaned = items.filter(
    (it) => it.day.trim() || it.title.trim() || it.desc.trim(),
  );
  const serialized = JSON.stringify(cleaned);

  return (
    <div className="space-y-3">
      {/* Hidden field — what the server action reads */}
      <input type="hidden" name="itinerary" value={serialized} />

      {items.map((it, i) => (
        <div
          key={i}
          className="bg-ink/3 border border-ink/10 rounded-2xl p-4 space-y-3 relative"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink/45 font-bold">
              <GripVertical size={12} />
              فقرة {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="حرّكي للأعلى"
                className="w-7 h-7 grid place-items-center rounded-lg text-ink/40 hover:text-ink hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="حرّكي للأسفل"
                className="w-7 h-7 grid place-items-center rounded-lg text-ink/40 hover:text-ink hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={items.length === 1}
                aria-label="حذف هذه الفقرة"
                className="w-7 h-7 grid place-items-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              value={it.day}
              onChange={(e) => update(i, { day: e.target.value })}
              placeholder="اليوم 1-2"
              className={cellClass}
            />
            <input
              value={it.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="بانكوك — البداية"
              className={`${cellClass} md:col-span-2`}
            />
          </div>
          <textarea
            value={it.desc}
            onChange={(e) => update(i, { desc: e.target.value })}
            placeholder="مثال: وصول، جولة في معبد وات أرون، عشاء على نهر تشاو فرايا"
            rows={2}
            className={cellClass}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-coral/40 text-coral text-sm font-bold hover:bg-coral/5 transition-colors"
      >
        <Plus size={16} />
        أضيفي فقرة جديدة
      </button>
    </div>
  );
}

const cellClass =
  "w-full rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/50 transition-all";
