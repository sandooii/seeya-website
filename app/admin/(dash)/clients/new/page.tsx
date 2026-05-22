import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClientForm from "../ClientForm";
import { inviteClient } from "../actions";

export const metadata = { title: "إضافة عميلة — Admin" };

export default function NewClientPage() {
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
          إضافة عميلة جديدة
        </h1>
        <p className="text-ink/60 mt-2">
          النظام بيعمل حساب فوري للعميلة وبتقدر تسجل دخول من /login
        </p>
      </header>

      <div className="bg-white rounded-3xl border border-ink/5 p-6 md:p-8">
        <ClientForm
          action={inviteClient}
          submitLabel="إنشاء حساب العميلة"
          editableEmail={true}
        />
      </div>
    </div>
  );
}
