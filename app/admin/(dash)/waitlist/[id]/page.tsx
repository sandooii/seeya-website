import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WaitlistRow } from "@/lib/supabase/types";
import WaitlistForm from "../WaitlistForm";
import { updateWaitlistEntry } from "../actions";

export const metadata = { title: "تعديل إدخال — قائمة الانتظار" };

type Params = Promise<{ id: string }>;

export default async function EditWaitlistEntryPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: entry, error } = await supabase
    .from("waitlist")
    .select("*")
    .eq("id", id)
    .single<WaitlistRow>();

  if (error || !entry) {
    notFound();
  }

  const { data: trips } = await supabase
    .from("trips")
    .select("id, name, country, status")
    .order("sort_order", { ascending: true });

  const updateAction = updateWaitlistEntry.bind(null, entry.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <Link
          href="/admin/waitlist"
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors mb-3"
        >
          <ArrowRight size={14} />
          <span>العودة للقائمة</span>
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          تعديل: {entry.full_name}
        </h1>
        <p className="text-ink/60 mt-2" dir="ltr">
          #{entry.id.slice(0, 8)}
        </p>
      </header>

      <WaitlistForm
        entry={entry}
        trips={trips ?? []}
        action={updateAction}
        submitLabel="حفظ التعديلات"
      />
    </div>
  );
}
