import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripRow, WaitlistRow } from "@/lib/supabase/types";
import { waitlistStatusColor, waitlistStatusLabel } from "@/lib/waitlist";
import { normalizePhone } from "@/lib/auth-helpers";

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

  const myDigits = normalizePhone(profile?.phone ?? "");

  // Fetch waitlist with trip joined, then filter client-side on
  // normalized digits so "+972 50…" matches "0501…" etc.
  const { data, error } = await supabase
    .from("waitlist")
    .select(
      `
      *,
      trip:trips(id, slug, name, country, image_url, month)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        خطأ في تحميل القائمة: {error.message}
      </div>
    );
  }

  // Compare on the last 9 digits — robust to leading 0 / country code variance.
  const tail = (s: string) => s.slice(-9);
  const myTail = tail(myDigits);

  const entries = ((data ?? []) as WaitlistWithTrip[]).filter(
    (e) => myTail && tail(normalizePhone(e.phone)) === myTail,
  );

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
        {entries.map((e) => {
          const isOpen =
            e.status === "waiting" || e.status === "offered";
          return (
            <article
              key={e.id}
              className="group bg-white rounded-3xl border border-ink/5 overflow-hidden flex flex-col"
            >
              {e.trip && (
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={e.trip.image_url}
                    alt={e.trip.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between gap-2 text-white">
                    <div className="min-w-0">
                      <div className="text-base md:text-lg font-black drop-shadow truncate">
                        {e.trip.name}
                      </div>
                      <div
                        className="text-[11px] text-white/80 mt-0.5 tabular-nums"
                        dir="ltr"
                      >
                        {e.trip.country} · {e.trip.month}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${waitlistStatusColor[e.status]}`}
                    >
                      {waitlistStatusLabel[e.status]}
                    </span>
                  </div>
                </div>
              )}
              {!e.trip && (
                <div className="px-5 pt-5">
                  <div className="text-ink/55 text-sm font-bold">
                    رحلة محذوفة
                  </div>
                </div>
              )}

              <div className="p-5">
                {isOpen ? (
                  <p className="text-sm text-ink/70 leading-relaxed">
                    {e.status === "offered" ? (
                      <>
                        🌸 <strong>صار في مكان!</strong> راح نتواصل معك على
                        الواتساب قريباً لتأكيد الحجز.
                      </>
                    ) : (
                      <>
                        🌸 سجّلناك بقائمة الانتظار — بنبلغك على واتساب أول لما
                        يصير في مكان.
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-ink/55">
                    {e.status === "converted"
                      ? "🎉 تم تحويلك لحجز فعلي — شوفي رحلاتك من 'رحلاتي'"
                      : "هاي الإدخالة مش نشطة"}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
