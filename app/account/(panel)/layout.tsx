import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isInternalEmail } from "@/lib/auth-helpers";
import AccountSidebar from "../AccountSidebar";

/**
 * Sidebar shell — wraps the authenticated client area.
 *
 * Admin pre-creates every client account (via /admin/clients/new or by
 * converting a booking), and that flow always populates full_name +
 * phone. If we ever land here with an incomplete profile, it's a sign
 * of manual DB tampering or a Supabase trigger race — bail out by
 * signing the user out so they re-enter through the supported path.
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
    // Profile is missing required fields — admin needs to fix the
    // record. Signing out is the safe move; the welcome wizard
    // (legacy OTP-era) was removed in Phase 10.
    await supabase.auth.signOut();
    redirect("/login?next=/account&reason=incomplete_profile");
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
