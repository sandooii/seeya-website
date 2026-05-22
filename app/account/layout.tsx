import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "حسابي — SeeYa",
  robots: { index: false, follow: false },
};

/**
 * Outer /account layout — handles the auth gate ONLY. The sidebar +
 * branded shell lives in (panel)/layout.tsx so /account/welcome (the
 * first-login wizard) can render full-screen without a sidebar.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  // Admins use /admin
  if (profile.role === "admin") {
    redirect("/admin");
  }

  return <>{children}</>;
}
