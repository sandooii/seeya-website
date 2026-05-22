"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveLoginEmail } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
};

/**
 * Client password sign-in.
 *
 * The "username" field accepts:
 *   - The client's phone number (digits only) — most common case
 *   - A real email address — for clients who chose to use one
 *
 * Password is always the client's phone number (digits only).
 */
export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const usernameRaw = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  if (!usernameRaw || !password) {
    return { error: "رقم التلفون أو الإيميل وكلمة السر مطلوبين" };
  }

  const email = resolveLoginEmail(usernameRaw);
  if (!email) {
    return { error: "أدخلي رقم تلفون صحيح أو إيميل" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return {
        error:
          "البيانات غير صحيحة — رقم التلفون أو كلمة السر غلط. تواصلي معنا لو في مشكلة.",
      };
    }
    if (msg.includes("email not confirmed")) {
      return { error: "يجب تأكيد الحساب أولاً" };
    }
    return { error: error.message };
  }

  // Admins should land in /admin, not /account
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const safeNext =
      profile?.role === "admin" && next.startsWith("/account")
        ? "/admin"
        : next;

    redirect(safeNext);
  }

  redirect(next);
}
