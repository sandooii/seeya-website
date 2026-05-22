"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/auth-helpers";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type JoinWaitlistResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Public-facing server action: a visitor (anon) signs up to a trip's
 * waitlist by slug. The `waitlist_public_insert` RLS policy lets the
 * anon role insert; reads stay locked down to admins.
 *
 * Inputs are sanitized server-side regardless of client validation.
 */
export async function joinWaitlistBySlug(
  tripSlug: string,
  prev: JoinWaitlistResult | undefined,
  formData: FormData,
): Promise<JoinWaitlistResult> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.full_name = "الاسم الكامل مطلوب";
  if (normalizePhone(phone).length < 7)
    fieldErrors.phone = "رقم الواتساب غير صالح";
  if (email && !EMAIL_RE.test(email))
    fieldErrors.email = "صيغة الإيميل غير صالحة";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "تأكدي من الحقول", fieldErrors };
  }

  if (!tripSlug) {
    return { ok: false, error: "رحلة غير صالحة" };
  }

  const supabase = await createServerSupabaseClient();

  // Resolve slug → trip UUID. The waitlist table FK references trips.id.
  const { data: trip, error: tripErr } = await supabase
    .from("trips")
    .select("id, name")
    .eq("slug", tripSlug)
    .single();

  if (tripErr || !trip) {
    return { ok: false, error: "ما لقينا الرحلة" };
  }

  // Prevent duplicate signups for the same trip+phone combo.
  const { data: existing } = await supabase
    .from("waitlist")
    .select("id")
    .eq("trip_id", trip.id)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: "أنتي مسجّلة بقائمة الانتظار لهالرحلة من قبل ✨",
    };
  }

  const { error: insertErr } = await supabase.from("waitlist").insert({
    trip_id: trip.id,
    full_name: fullName,
    phone,
    email: email || null,
    notes: notes || null,
    status: "waiting",
  });

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  // Surface the new entry to admins instantly.
  revalidatePath("/admin/waitlist");
  revalidatePath("/admin");
  return { ok: true };
}
