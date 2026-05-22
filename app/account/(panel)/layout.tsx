import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isInternalEmail } from "@/lib/auth-helpers";
import AccountSidebar from "../AccountSidebar";

/**
 * Sidebar shell — wraps the authenticated client area. The /account/welcome
 * wizard lives OUTSIDE this group and renders full-screen.
 *
 * If the user hasn't completed her profile yet, route her to /welcome
 * here (after first OTP login) so she lands on the right place.
 */
export default async function AccountPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (!profile.full_name?.trim() || !profile.phone?.trim()) {
    redirect("/account/welcome");
  }

  // Show real email if she has one; otherwise fall back to her phone.
  // We never expose the synthetic <phone>@seeya.app address.
  const realEmail = isInternalEmail(profile.email) ? "" : (profile.email ?? "");
  const contactLine = realEmail || profile.phone || "";

  return (
    <div className="min-h-screen flex bg-cream" dir="rtl">
      <AccountSidebar
        userName={profile.full_name ?? "بدون اسم"}
        userEmail={contactLine}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-5 md:px-8 pt-20 md:pt-12 pb-8 md:pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
