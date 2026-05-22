import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Compass } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripRow } from "@/lib/supabase/types";
import CompanionEditor from "./CompanionEditor";

export const metadata = { title: "دليل الرحلة — Admin" };

type Params = Promise<{ id: string }>;

export default async function TripCompanionPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single<TripRow>();

  if (error || !trip) notFound();

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      <header>
        <Link
          href={`/admin/trips/${trip.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors mb-3"
        >
          <ArrowRight size={14} />
          <span>العودة لتعديل الرحلة</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral grid place-items-center">
            <Compass size={22} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-ink">
              دليل الرحلة
            </h1>
            <p className="text-ink/60 mt-1">
              {trip.name} · {trip.country}
            </p>
          </div>
        </div>
        <p className="text-ink/50 text-sm mt-3 max-w-2xl">
          هون بتضبطي معلومات الطيران، الفندق، المطاعم، التوصيات والتحذيرات
          لكل البنات اللي بيحجزوا هاي الرحلة. كل وحدة بتشوفها بصفحتها الشخصية
          لما تسجل دخول.
        </p>
      </header>

      <CompanionEditor
        tripId={trip.id}
        initial={trip.companion_content ?? {}}
      />
    </div>
  );
}
