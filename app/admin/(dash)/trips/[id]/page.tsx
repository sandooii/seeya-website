import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripRow } from "@/lib/supabase/types";
import TripForm from "../TripForm";
import { updateTrip } from "../actions";

export const metadata = { title: "تعديل رحلة — Admin" };

type Params = Promise<{ id: string }>;

export default async function EditTripPage({ params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single<TripRow>();

  if (error || !trip) {
    notFound();
  }

  // Bind the trip ID to the update action so the form can call it as a regular action
  const updateAction = updateTrip.bind(null, trip.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <Link
          href="/admin/trips"
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors mb-3"
        >
          <ArrowRight size={14} />
          <span>العودة للرحلات</span>
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-ink">
              تعديل: {trip.name}
            </h1>
            <p className="text-ink/60 mt-2" dir="ltr">
              {trip.slug}
            </p>
          </div>
          <Link
            href={`/admin/trips/${trip.id}/companion`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-coral/10 text-coral text-sm font-bold hover:bg-coral/20 transition-colors border border-coral/20"
          >
            <Compass size={16} />
            <span>دليل الرحلة (للعميلات)</span>
          </Link>
        </div>
      </header>

      <TripForm
        trip={trip}
        action={updateAction}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
