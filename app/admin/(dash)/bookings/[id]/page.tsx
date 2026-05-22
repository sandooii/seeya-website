import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";
import { bookingClientName } from "@/lib/bookings";
import BookingForm from "../BookingForm";
import { updateBooking } from "../actions";

export const metadata = { title: "تعديل حجز — Admin" };

type Params = Promise<{ id: string }>;

export default async function EditBookingPage({ params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single<BookingRow>();

  if (error || !booking) {
    notFound();
  }

  const { data: trips } = await supabase
    .from("trips")
    .select("id, name, country, price, currency, status")
    .order("sort_order", { ascending: true });

  const updateAction = updateBooking.bind(null, booking.id);

  // For display title, fall back to inline name (clients don't have profiles yet)
  const displayName =
    booking.client_name?.trim() ||
    booking.client_phone ||
    bookingClientName({ ...booking, trip: null, client_profile: null });

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors mb-3"
        >
          <ArrowRight size={14} />
          <span>العودة للحجوزات</span>
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          تعديل: {displayName}
        </h1>
        <p className="text-ink/60 mt-2" dir="ltr">
          #{booking.id.slice(0, 8)}
        </p>
      </header>

      <BookingForm
        booking={booking}
        trips={trips ?? []}
        action={updateAction}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
