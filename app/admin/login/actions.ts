"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
};

export async function signInWithPassword(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "البريد الإلكتروني وكلمة المرور مطلوبان" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Translate the most common Supabase auth errors to Arabic
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) {
      return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    if (msg.includes("email not confirmed")) {
      return { error: "يجب تأكيد البريد الإلكتروني أولاً" };
    }
    return { error: error.message };
  }

  // Verify the user is actually an admin before redirecting
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return {
      error: "هذا الحساب ليس لديه صلاحيات إدارية",
    };
  }

  redirect(next);
}
