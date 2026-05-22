import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminSidebar from "./AdminSidebar";

export const metadata = {
  title: "لوحة الإدارة — SeeYa",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware should already redirect, but belt-and-suspenders:
  if (!user) {
    redirect("/admin/login");
  }

  // Double-gate: verify the role is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    // Sign out and redirect — they shouldn't be in here
    await supabase.auth.signOut();
    redirect("/admin/login?next=/admin");
  }

  return (
    <div className="min-h-screen flex bg-cream" dir="rtl">
      <AdminSidebar
        userName={profile.full_name ?? profile.email ?? "Admin"}
        userEmail={profile.email ?? ""}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-10 pt-20 md:pt-12 pb-8 md:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
