import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingForm from "../BookingForm";
import { createBooking } from "../actions";

export const metadata = { title: "حجز جديد — Admin" };

export default async function NewBookingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, name, country, price, currency, status")
    .order("sort_order", { ascending: true });

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
          إضافة حجز جديد
        </h1>
        <p className="text-ink/60 mt-2">
          سجّلي معلومات الحجز اللي جاكِ بالواتساب
        </p>
      </header>

      <BookingForm
        trips={trips ?? []}
        action={createBooking}
        submitLabel="إنشاء الحجز"
      />
    </div>
  );
}
