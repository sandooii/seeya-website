import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TripForm from "../TripForm";
import { createTrip } from "../actions";

export const metadata = { title: "رحلة جديدة — Admin" };

export default function NewTripPage() {
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
        <h1 className="text-4xl md:text-5xl font-black text-ink">
          إضافة رحلة جديدة
        </h1>
        <p className="text-ink/60 mt-2">املئي الفورم وضغطي حفظ</p>
      </header>

      <TripForm action={createTrip} submitLabel="إنشاء الرحلة" />
    </div>
  );
}
