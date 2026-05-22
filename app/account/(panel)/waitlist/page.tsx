import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripRow, WaitlistRow } from "@/lib/supabase/types";
import { waitlistStatusColor, waitlistStatusLabel } from "@/lib/waitlist";

export const metadata = { title: "قائمة انتظاري — SeeYa" };

type WaitlistWithTrip = WaitlistRow & {
  trip: Pick<
    TripRow,
    "id" | "slug" | "name" | "country" | "image_url" | "month"
  > | null;
};

export default async function MyWaitlistPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .single();

  const phone = profile?.phone ?? "__no_phone__";

  const { data, error } = await supabase
    .from("waitlist")
    .select(
      `
      *,
      trip:trips(id, slug, name, country, image_url, month)
    `,
    )
    .eq("phone", phone)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        خطأ في تحميل القائمة: {error.message}
      </div>
    );
  }

  const entries = (data ?? []) as WaitlistWithTrip[];

  return (
    <div className="space-y-6" dir="rtl">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          قائمة انتظاري
        </h1>
        <p className="text-ink/60 mt-2">
          {entries.length === 0
            ? "ما إنتي بأي قائمة انتظار"
            : `${entries.length} ${entries.length === 1 ? "إدخال" : "إدخالات"}`}
        </p>
      </header>

      {entries.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-ink/15 p-12 text-center">
          <p className="text-ink/55 mb-4">
            إذا في رحلة sold-out وحبيتي تنضمي لقائمة الانتظار، رح تظهر هون.
          </p>
          <Link
            href="/#trips"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral text-white text-sm font-bold hover:brightness-110"
          >
            تصفحي الرحلات
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map((e) => (
          <article
            key={e.id}
            className="bg-white rounded-3xl border border-ink/5 p-5 flex items-center gap-4"
          >
            {e.trip && (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                <Image
                  src={e.trip.image_url}
                  alt={e.trip.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-black text-ink text-lg">
                {e.trip?.name ?? "رحلة محذوفة"}
              </div>
              <div className="text-xs text-ink/55 mt-0.5">
                {e.trip?.month}
              </div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-2 ${waitlistStatusColor[e.status]}`}
              >
                {waitlistStatusLabel[e.status]}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
