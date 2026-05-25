import Link from "next/link";
import { Plus, Edit3, Mail, Phone, MessageCircle } from "lucide-react";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import type { Profile, BookingRow } from "@/lib/supabase/types";
import { formatBookingPrice } from "@/lib/bookings";
import { waLink } from "@/lib/contact";
import DeleteClientButton from "./DeleteClientButton";

export const metadata = { title: "العميلات — Admin" };

type ClientStats = {
  bookingsCount: number;
  paidUSD: number;
  paidILS: number;
};

export default async function ClientsAdminPage() {
  const supabase = await createServerSupabaseClient();
  const admin = createServiceRoleClient();

  // Fetch all client profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email, role, created_at")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
        <h2 className="font-bold mb-2">خطأ في تحميل العميلات</h2>
        <pre className="text-xs whitespace-pre-wrap">{error.message}</pre>
      </div>
    );
  }

  const clients = (profiles ?? []) as Pick<
    Profile,
    "id" | "full_name" | "phone" | "email" | "role" | "created_at"
  >[];

  // Build per-client booking stats in one query
  const statsMap = new Map<string, ClientStats>();
  if (clients.length > 0) {
    const { data: stats } = await supabase
      .from("bookings")
      .select("client_id, status, paid_amount, currency")
      .in(
        "client_id",
        clients.map((c) => c.id),
      );

    for (const b of (stats ?? []) as Pick<
      BookingRow,
      "client_id" | "status" | "paid_amount" | "currency"
    >[]) {
      if (!b.client_id) continue;
      const s = statsMap.get(b.client_id) ?? {
        bookingsCount: 0,
        paidUSD: 0,
        paidILS: 0,
      };
      s.bookingsCount++;
      if (b.status !== "cancelled") {
        if (b.currency === "USD") s.paidUSD += Number(b.paid_amount);
        else s.paidILS += Number(b.paid_amount);
      }
      statsMap.set(b.client_id, s);
    }
  }

  // Fetch last_sign_in_at for each client via admin API
  const lastLoginMap = new Map<string, string | null>();
  if (clients.length > 0) {
    // listUsers returns paginated results — for now, our user base is tiny
    const { data: usersList } = await admin.auth.admin.listUsers({
      perPage: 200,
    });
    for (const u of usersList?.users ?? []) {
      lastLoginMap.set(u.id, u.last_sign_in_at ?? null);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-ink">
            العميلات
          </h1>
          <p className="text-ink/60 mt-2">
            {clients.length} عميلة مسجّلة بحساب
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-coral text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Plus size={18} />
          <span>إضافة عميلة</span>
        </Link>
      </header>

      <div className="bg-white rounded-3xl border border-ink/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-ink/3 border-b border-ink/8">
              <tr className="text-ink/60 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-bold">العميلة</th>
                <th className="px-4 py-3 font-bold">الحجوزات</th>
                <th className="px-4 py-3 font-bold">إجمالي المدفوع</th>
                <th className="px-4 py-3 font-bold">آخر دخول</th>
                <th className="px-4 py-3 font-bold">تاريخ التسجيل</th>
                <th className="px-4 py-3 font-bold text-center w-32">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {clients.map((c) => {
                const s = statsMap.get(c.id) ?? {
                  bookingsCount: 0,
                  paidUSD: 0,
                  paidILS: 0,
                };
                const lastLogin = lastLoginMap.get(c.id);
                const initials = (c.full_name ?? "?")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <tr key={c.id} className="hover:bg-ink/2 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral/15 text-coral grid place-items-center font-black text-sm shrink-0">
                          {initials || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink truncate">
                            {c.full_name ?? "بدون اسم"}
                          </div>
                          {c.email && (
                            <a
                              href={`mailto:${c.email}`}
                              dir="ltr"
                              className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-coral mt-0.5"
                            >
                              <Mail size={11} />
                              {c.email}
                            </a>
                          )}
                          {c.phone && (
                            <a
                              href={waLink(`أهلاً ${c.full_name ?? ""}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              dir="ltr"
                              className="flex items-center gap-1 text-xs text-ink/50 hover:text-coral mt-0.5"
                            >
                              <Phone size={11} />
                              {c.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-ink tabular-nums">
                        {s.bookingsCount}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 align-top text-sm tabular-nums"
                      dir="ltr"
                    >
                      {s.paidUSD > 0 && (
                        <div className="text-ink font-bold">
                          {formatBookingPrice(s.paidUSD, "USD")}
                        </div>
                      )}
                      {s.paidILS > 0 && (
                        <div className="text-ink/60 text-xs">
                          {formatBookingPrice(s.paidILS, "ILS")}
                        </div>
                      )}
                      {s.paidUSD === 0 && s.paidILS === 0 && (
                        <span className="text-ink/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-ink/60">
                      {lastLogin ? (
                        <span dir="ltr" className="tabular-nums">
                          {formatDateTime(lastLogin)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                          ما دخلت بعد
                        </span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 align-top text-xs text-ink/60 tabular-nums"
                      dir="ltr"
                    >
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-center gap-2">
                        {c.phone && (
                          <a
                            href={waLink(`أهلاً ${c.full_name ?? ""}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="واتساب"
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}
                        <Link
                          href={`/admin/clients/${c.id}`}
                          aria-label="تعديل"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-ink/60 hover:bg-coral/10 hover:text-coral transition-colors"
                        >
                          <Edit3 size={16} />
                        </Link>
                        <DeleteClientButton
                          clientId={c.id}
                          fullName={c.full_name ?? "العميلة"}
                          hasBookings={s.bookingsCount > 0}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {clients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-ink/40"
                  >
                    لا توجد عميلات مسجّلات بعد. اضغطي &quot;إضافة عميلة&quot; لإنشاء أول حساب.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hh}:${mm}`;
}
