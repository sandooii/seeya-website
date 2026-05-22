"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WelcomeState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  linkedCount?: number;
};

/** Strip everything that isn't a digit. Used to match phones cross-format. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function completeProfile(
  _prev: WelcomeState,
  formData: FormData,
): Promise<WelcomeState> {
  const fieldErrors: Record<string, string> = {};

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) fieldErrors.full_name = "الاسم مطلوب";

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) fieldErrors.phone = "رقم الواتساب مطلوب";
  else if (normalizePhone(phone).length < 7)
    fieldErrors.phone = "رقم غير صالح";

  const next = String(formData.get("next") ?? "/account");

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "الجلسة انتهت — سجلي دخول مرة ثانية" };

  // 1) Save name + phone to the profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", user.id);

  if (updateError) return { error: updateError.message };

  // 2) Link any "orphan" bookings (client_id NULL) whose client_phone matches
  //    this user's new phone. This is how manual WhatsApp bookings entered
  //    by admin before OTP launched get attached to the client's account.
  const normalized = normalizePhone(phone);
  let linkedCount = 0;
  if (normalized.length >= 7) {
    const { data: orphanBookings } = await supabase
      .from("bookings")
      .select("id, client_phone")
      .is("client_id", null);

    const toLink = (orphanBookings ?? [])
      .filter(
        (b) =>
          b.client_phone && normalizePhone(b.client_phone) === normalized,
      )
      .map((b) => b.id);

    if (toLink.length > 0) {
      const { error: linkError } = await supabase
        .from("bookings")
        .update({ client_id: user.id })
        .in("id", toLink);
      if (!linkError) {
        linkedCount = toLink.length;
      }
    }
  }

  revalidatePath("/account");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/clients");

  // Stash a one-time "linked" hint via the next URL so the dashboard can
  // greet returning clients with their reattached bookings.
  const url = new URL(next, "https://placeholder");
  if (linkedCount > 0) url.searchParams.set("linked", String(linkedCount));
  redirect(url.pathname + url.search);
}
