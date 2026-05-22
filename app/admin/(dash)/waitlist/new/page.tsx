import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import WaitlistForm from "../WaitlistForm";
import { createWaitlistEntry } from "../actions";

export const metadata = { title: "إدخال جديد — قائمة الانتظار" };

export default async function NewWaitlistEntryPage() {
  const supabase = await createServerSupabaseClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("id, name, country, status")
    .order("sort_order", { ascending: true });

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
          إضافة لقائمة الانتظار
        </h1>
        <p className="text-ink/60 mt-2">
          سجّلي مسافرة جديدة بقائمة الانتظار لرحلة مكتملة
        </p>
      </header>

      <WaitlistForm
        trips={trips ?? []}
        action={createWaitlistEntry}
        submitLabel="إنشاء الإدخال"
      />
    </div>
  );
}
