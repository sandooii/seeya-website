import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  bookingStatusColor,
  bookingStatusLabel,
  formatBookingPrice,
  paymentProgress,
  remainingAmount,
} from "@/lib/bookings";
import type {
  BookingStatus,
  CurrencyCode,
} from "@/lib/supabase/types";
import ClientForm from "../ClientForm";
import ResetPasswordButton from "../ResetPasswordButton";
import WhatsAppTemplatesPanel from "./WhatsAppTemplatesPanel";
import { updateClient } from "../actions";

export const metadata = { title: "تعديل عميلة — Admin" };

type Params = Promise<{ id: string }>;

/** A booking joined with its trip + computed payment metrics. */
type ClientBooking = {
  id: string;
  status: BookingStatus;
  total_amount: number;
  paid_amount: number;
  deposit_amount: number;
  currency: CurrencyCode;
  created_at: string;
  trip: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
};

/** Format an ISO date like "2026-06-02" as "02.06.2026" (SANDO format). */
function formatDateDmy(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso.slice(0, 10);
  return `${d}.${m}.${y}`;
}

export default async function EditClientPage({ params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: client, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email, role, admin_notes, created_at")
    .eq("id", id)
    .single();

  if (error || !client || client.role !== "client") {
    notFound();
  }

  // Pull every booking attached to this profile + its trip metadata
  // so the central hub can show "her booking history" at a glance.
  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select(
      `
      id, status, total_amount, paid_amount, deposit_amount, currency, created_at,
      trip:trips ( id, name, image_url )
    `,
    )
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  // Supabase types the joined relation as an array; we know it's
  // 1:1 since trip_id is a single FK, so normalize for ergonomics.
  const bookings: ClientBooking[] = (bookingsRaw ?? []).map((b) => {
    const tripRel = b.trip as
      | { id: string; name: string; image_url: string | null }[]
      | { id: string; name: string; image_url: string | null }
      | null;
    return {
      id: b.id,
      status: b.status as BookingStatus,
      total_amount: Number(b.total_amount),
      paid_amount: Number(b.paid_amount),
      deposit_amount: Number(b.deposit_amount),
      currency: b.currency as CurrencyCode,
      created_at: b.created_at,
      trip: Array.isArray(tripRel) ? (tripRel[0] ?? null) : tripRel,
    };
  });

  const totalPaid = bookings.reduce(
    (acc, b) => {
      acc[b.currency] += b.paid_amount;
      return acc;
    },
    { ILS: 0, USD: 0 } as Record<CurrencyCode, number>,
  );

  // Pick the most recent non-cancelled booking as the "active" one
  // for the WhatsApp templates — the deposit/balance/day-before
  // templates need a specific trip context to fill in.
  const activeBooking = bookings.find((b) => b.status !== "cancelled");

  const updateAction = updateClient.bind(null, client.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors mb-3"
        >
          <ArrowRight size={14} />
          <span>العودة للعميلات</span>
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          {client.full_name ?? "العميلة"}
        </h1>
        <div className="text-ink/55 mt-2 flex items-center gap-3 flex-wrap text-sm">
          {client.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone size={13} />
              <bdi dir="ltr" className="tabular-nums">
                {client.phone}
              </bdi>
            </span>
          )}
          {client.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail size={13} />
              <bdi dir="ltr">{client.email}</bdi>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} />
            انضمت {formatDateDmy(client.created_at)}
          </span>
        </div>
      </header>

      {/* ─── At-a-glance summary cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={BookOpen}
          label="الحجوزات"
          value={String(bookings.length)}
          accent="coral"
        />
        <SummaryCard
          icon={Sparkles}
          label="المدفوع (₪)"
          value={`${Math.round(totalPaid.ILS).toLocaleString("en-US")} ₪`}
          accent="emerald"
        />
        <SummaryCard
          icon={Sparkles}
          label="المدفوع ($)"
          value={`${Math.round(totalPaid.USD).toLocaleString("en-US")} $`}
          accent="ink"
        />
      </div>

      {/* ─── Bookings history ─────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-ink/5 p-5 md:p-7">
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-ink">رحلات العميلة</h2>
          {bookings.length > 0 && (
            <Link
              href={`/admin/bookings?q=${encodeURIComponent(client.phone ?? client.full_name ?? "")}`}
              className="text-xs text-coral hover:underline"
            >
              فتح كلها بقائمة الحجوزات ←
            </Link>
          )}
        </header>
        {bookings.length === 0 ? (
          <div className="text-center py-6 text-ink/45 text-sm">
            ما عندها حجوزات لسا — تقدري تضيفي لها حجز جديد من{" "}
            <Link
              href="/admin/bookings/new"
              className="text-coral hover:underline font-bold"
            >
              صفحة الحجوزات
            </Link>
            .
          </div>
        ) : (
          <ul className="space-y-2.5">
            {bookings.map((b) => {
              const remaining = remainingAmount({
                total_amount: b.total_amount,
                paid_amount: b.paid_amount,
              });
              const pct = paymentProgress({
                total_amount: b.total_amount,
                paid_amount: b.paid_amount,
              });
              return (
                <li key={b.id}>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="block rounded-2xl border border-ink/8 hover:border-coral/40 hover:shadow-[0_8px_22px_-15px_rgba(249,92,107,0.4)] transition-all p-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-ink/5 shrink-0 relative">
                        {b.trip?.image_url && (
                          <Image
                            src={b.trip.image_url}
                            alt={b.trip.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-ink truncate">
                            {b.trip?.name ?? "رحلة محذوفة"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${bookingStatusColor[b.status]}`}
                          >
                            {bookingStatusLabel[b.status]}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-ink/8 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-coral rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            className="text-xs text-ink/55 tabular-nums"
                            dir="ltr"
                          >
                            {formatBookingPrice(b.paid_amount, b.currency)} /{" "}
                            {formatBookingPrice(b.total_amount, b.currency)}
                          </span>
                        </div>
                        {remaining > 0 && (
                          <p
                            className="text-[11px] text-ink/45 mt-0.5"
                            dir="ltr"
                          >
                            متبقي {formatBookingPrice(remaining, b.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ─── WhatsApp templates panel ─────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-ink/5 p-5 md:p-7">
        <WhatsAppTemplatesPanel
          clientName={client.full_name ?? "العميلة"}
          phone={client.phone}
          activeBooking={
            activeBooking && activeBooking.trip
              ? {
                  tripName: activeBooking.trip.name,
                  depositAmount: activeBooking.deposit_amount,
                  remaining: remainingAmount({
                    total_amount: activeBooking.total_amount,
                    paid_amount: activeBooking.paid_amount,
                  }),
                  currency: activeBooking.currency,
                }
              : null
          }
        />
      </section>

      {/* ─── Notes preview (read-only, full editing below in form) ─ */}
      {client.admin_notes && (
        <section className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote size={16} className="text-amber-700" />
            <h3 className="font-black text-amber-900">ملاحظاتك عنها</h3>
          </div>
          <p className="text-sm text-amber-900/85 whitespace-pre-wrap leading-relaxed">
            {client.admin_notes}
          </p>
        </section>
      )}

      {/* ─── Edit form ────────────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-ink/5 p-6 md:p-8">
        <h2 className="text-xl font-black text-ink mb-5">تعديل البيانات</h2>
        <ClientForm
          defaultName={client.full_name ?? ""}
          defaultPhone={client.phone ?? ""}
          defaultEmail={client.email ?? ""}
          defaultAdminNotes={client.admin_notes ?? ""}
          action={updateAction}
          submitLabel="حفظ التعديلات"
          editableEmail={false}
        />
      </section>

      {/* ─── Password reset ───────────────────────────────────────── */}
      <section className="bg-white rounded-3xl border border-ink/5 p-6">
        <h2 className="text-lg font-black text-ink mb-1">كلمة السر</h2>
        <p className="text-ink/55 text-sm mb-4">
          كلمة سر العميلة = رقم تلفونها (أرقام فقط). إذا نستيها أو
          غيّرتي رقمها يدوياً من قاعدة البيانات، اضغطي الزر تحت
          لتوحيدها مع الرقم الحالي.
        </p>
        <ResetPasswordButton clientId={client.id} phone={client.phone} />
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent: "coral" | "emerald" | "ink";
}) {
  const accentBg = {
    coral: "bg-coral/10 text-coral",
    emerald: "bg-emerald-100 text-emerald-700",
    ink: "bg-ink/8 text-ink",
  }[accent];
  return (
    <div className="bg-white rounded-2xl border border-ink/5 p-4 flex items-center gap-3">
      <div
        className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${accentBg}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink/55">{label}</p>
        <p className="text-lg font-black text-ink tabular-nums" dir="ltr">
          {value}
        </p>
      </div>
    </div>
  );
}
