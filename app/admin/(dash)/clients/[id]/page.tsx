import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ClientForm from "../ClientForm";
import { updateClient } from "../actions";

export const metadata = { title: "تعديل عميلة — Admin" };

type Params = Promise<{ id: string }>;

export default async function EditClientPage({ params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: client, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email, role")
    .eq("id", id)
    .single();

  if (error || !client || client.role !== "client") {
    notFound();
  }

  const updateAction = updateClient.bind(null, client.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-coral transition-colors mb-3"
        >
          <ArrowRight size={14} />
          <span>العودة للعميلات</span>
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          تعديل: {client.full_name ?? "العميلة"}
        </h1>
        <p className="text-ink/60 mt-2" dir="ltr">
          #{client.id.slice(0, 8)}
        </p>
      </header>

      <div className="bg-white rounded-3xl border border-ink/5 p-6 md:p-8">
        <ClientForm
          defaultName={client.full_name ?? ""}
          defaultPhone={client.phone ?? ""}
          defaultEmail={client.email ?? ""}
          action={updateAction}
          submitLabel="حفظ التعديلات"
          editableEmail={false}
        />
      </div>
    </div>
  );
}
