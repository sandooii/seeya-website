"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const fieldErrors: Record<string, string> = {};

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) fieldErrors.full_name = "الاسم مطلوب";

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) fieldErrors.phone = "رقم الواتساب مطلوب";
  else if (normalizePhone(phone).length < 7)
    fieldErrors.phone = "رقم غير صالح";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "الجلسة انتهت — سجلي دخول مرة ثانية" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}
