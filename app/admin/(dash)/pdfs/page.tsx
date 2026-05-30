import Link from "next/link";
import Image from "next/image";
import { FileText, AlertTriangle, ExternalLink } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TripRow } from "@/lib/supabase/types";
import { getTripPdfUrl } from "@/lib/pdfs";
import PdfUpload from "@/components/admin/PdfUpload";
import EmptyState from "@/components/admin/EmptyState";

export const metadata = { title: "الملفات — Admin" };

export default async function PdfsAdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        <h2 className="font-bold mb-2">خطأ في تحميل الرحلات</h2>
        <pre className="text-xs whitespace-pre-wrap">{error.message}</pre>
      </div>
    );
  }

  const list = (trips ?? []) as TripRow[];
  const withPdf = list.filter((t) => !!t.pdf_path).length;
  const missingPdf = list.length - withPdf;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          ملفات الرحلات (PDFs)
        </h1>
        <p className="text-ink/60 mt-2">
          ارفعي برنامج كل رحلة كملف PDF — بيظهر للعميلات بصفحة الرحلة كزر تحميل.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="إجمالي الرحلات" value={list.length} />
        <StatCard
          label="فيها PDF"
          value={withPdf}
          accent="emerald"
        />
        <StatCard
          label="بدون PDF"
          value={missingPdf}
          accent={missingPdf > 0 ? "amber" : undefined}
        />
      </div>

      <div className="space-y-4">
        {list.map((trip) => {
          const url = getTripPdfUrl(trip.pdf_path, trip.updated_at);
          const hasPdf = !!trip.pdf_path;
          return (
            <article
              key={trip.id}
              className="bg-white rounded-3xl border border-ink/5 p-5 md:p-6"
            >
              <header className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-ink/5 shrink-0">
                  <Image
                    src={trip.image_url}
                    alt={trip.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-black text-ink">
                      {trip.name}
                    </h2>
                    {!hasPdf && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                        <AlertTriangle size={10} />
                        بدون PDF
                      </span>
                    )}
                    {hasPdf && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <FileText size={10} />
                        PDF
                      </span>
                    )}
                  </div>
                  <p className="text-ink/55 text-sm mt-1">
                    {trip.country} · {trip.month}
                  </p>
                  {hasPdf && url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      dir="ltr"
                      className="inline-flex items-center gap-1 text-xs text-coral hover:underline mt-1.5"
                    >
                      <ExternalLink size={11} />
                      فتح / تنزيل الملف الحالي
                    </a>
                  )}
                </div>
                <Link
                  href={`/admin/trips/${trip.id}`}
                  className="text-xs font-bold text-ink/60 hover:text-coral transition-colors"
                >
                  تعديل الرحلة ←
                </Link>
              </header>

              <div className="mt-5">
                <PdfUpload
                  tripId={trip.id}
                  tripName={trip.name}
                  currentPath={trip.pdf_path}
                  updatedAt={trip.updated_at}
                />
              </div>
            </article>
          );
        })}

        {list.length === 0 && (
          <div className="bg-white rounded-3xl border border-ink/5">
            <EmptyState
              icon={FileText}
              title="لا توجد رحلات بعد"
              description="ملفات الرحلات (PDF) بتنرفق على الرحلة نفسها — أضيفي رحلة أولاً وبعدها بتقدري ترفعي PDF لها."
              primaryHref="/admin/trips/new"
              primaryLabel="إضافة أول رحلة"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "amber" | "emerald";
}) {
  const colorClass =
    accent === "amber"
      ? "text-amber-600"
      : accent === "emerald"
        ? "text-emerald-600"
        : "text-ink";
  return (
    <div className="rounded-2xl bg-white border border-ink/5 p-4">
      <div className="text-xs text-ink/50 font-semibold uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-2xl md:text-3xl font-black mt-1 tabular-nums ${colorClass}`}
      >
        {value}
      </div>
    </div>
  );
}
