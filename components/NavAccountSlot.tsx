/**
 * Server-rendered slot that the Navbar drops into its toolbar.
 * Checks the auth state and renders one of:
 *   - "تسجيل دخول" → /login            (logged out)
 *   - First name   → /account          (logged-in client)
 *   - "اللوحة"     → /admin            (logged-in admin)
 */
import Link from "next/link";
import { LogIn, User, ShieldCheck } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PILL_CLASSES =
  "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md transition-colors";

const LIGHT_PILL =
  "bg-white/15 border border-white/30 text-white hover:bg-white/25";

const DARK_PILL =
  "bg-coral/10 border border-coral/30 text-coral hover:bg-coral/20";

export default async function NavAccountSlot({
  /**
   * When true, render the dark variant (used when the Navbar background
   * is white, i.e. scrolled past the hero). Defaults to the light variant.
   */
  dark = false,
}: {
  dark?: boolean;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pill = `${PILL_CLASSES} ${dark ? DARK_PILL : LIGHT_PILL}`;

  if (!user) {
    return (
      <Link href="/login" className={pill}>
        <LogIn size={14} />
        <span>تسجيل دخول</span>
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    return (
      <Link href="/admin" className={pill}>
        <ShieldCheck size={14} />
        <span>اللوحة</span>
      </Link>
    );
  }

  const firstName =
    (profile?.full_name ?? "").trim().split(" ")[0] || "حسابي";

  return (
    <Link href="/account" className={pill}>
      <User size={14} className="shrink-0" />
      <span className="max-w-[110px] truncate">{firstName}</span>
    </Link>
  );
}
