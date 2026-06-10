import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";
import { bookingClientName } from "@/lib/bookings";
import BookingForm from "../BookingForm";
import ConvertToClientButton from "../ConvertToClientButton";
import AccountCreatedBanner from "../AccountCreatedBanner";
import RefundStatusPanel from "../RefundStatusPanel";
import { updateBooking } from "../actions";

export const metadata = { title: "تعديل حجز — Admin" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ account?: string }>;

export default async function EditBookingPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { account } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single<BookingRow>();

  if (error || !booking) {
    notFound();
  }

  const [tripsResult, clientsResult] = await Promise.all([
    supabase
      .from("trips")
      .select("id, name, country, price, currency, status, available_spots")
      .order("sort_order", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, phone, email")
      .eq("role", "client")
      .order("full_name", { ascending: true }),
  ]);

  const updateAction = updateBooking.bind(null, booking.id);

  // For display title, fall back to inline name (clients don't have profiles yet)
  const displayName =
    booking.client_name?.trim() ||
    booking.client_phone ||
    bookingClientName({ ...booking, trip: null, client_profile: null });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Auto-create account outcome from createBooking redirect */}
      {account === "created" && booking.client_phone && (
        <AccountCreatedBanner
          clientName={displayName}
          phone={booking.client_phone}
        />
      )}
      {account === "exists" && (
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="text-amber-700 shrink-0 mt-0.5"
          />
          <div className="text-sm text-amber-900 leading-relaxed">
            <p className="font-bold mb-0.5">الحجز انحفظ بس الحساب موجود مسبقاً</p>
            <p className="text-amber-800/85">
              في حساب بنفس البلفون. روحي على{" "}
              <Link href="/admin/clients" className="underline font-bold">
                /admin/clients
              </Link>{" "}
              واربطي الحجز يدوياً عبر اختيارها من dropdown &quot;العميلة
              المسجّلة&quot;.
            </p>
          </div>
        </div>
      )}
      {account === "failed" && (
        <div className="rounded-3xl border-2 border-red-300 bg-red-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-700 shrink-0 mt-0.5" />
          <div className="text-sm text-red-900 leading-relaxed">
            <p className="font-bold mb-0.5">الحجز انحفظ لكن ما تم إنشاء الحساب</p>
            <p className="text-red-800/85">
              تقدري تحاولي يدوياً من الزر فوق &quot;إنشاء حساب لهالعميلة&quot;.
            </p>
          </div>
        </div>
      )}

      <header>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors mb-3"
        >
          <ArrowRight size={14} />
          <span>العودة للحجوزات</span>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-ink">
              تعديل: {displayName}
            </h1>
            <p className="text-ink/60 mt-2" dir="ltr">
              #{booking.id.slice(0, 8)}
            </p>
          </div>
          <ConvertToClientButton
            bookingId={booking.id}
            clientName={displayName}
            clientEmail={booking.client_email}
            clientPhone={booking.client_phone}
            hasAccount={!!booking.client_id}
          />
        </div>
      </header>

      {/* Refund panel — appears only for cancelled bookings so SANDO
          can flag the refund as paid out. The client portal flips
          its cancellation banner ('كلمينا عن الاسترداد' →
          '✓ تم الاسترداد بتاريخ X') based on what this panel writes. */}
      {booking.status === "cancelled" && (
        <RefundStatusPanel
          bookingId={booking.id}
          initialRefundedAt={booking.refunded_at}
          paidAmount={Number(booking.paid_amount)}
        />
      )}

      <BookingForm
        booking={booking}
        trips={tripsResult.data ?? []}
        clients={clientsResult.data ?? []}
        action={updateAction}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
