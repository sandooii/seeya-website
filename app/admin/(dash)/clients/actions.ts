"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";

export type ClientFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Create an auth user for a client + populate her profile row.
 * Called from /admin/clients/new and (optionally) the booking form.
 *
 * The auth row is created with `email_confirm: true` so the client
 * doesn't have to verify her email separately — she can immediately
 * sign in at /login with an OTP code.
 */
export async function inviteClient(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const fieldErrors: Record<string, string> = {};

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) fieldErrors.email = "البريد الإلكتروني مطلوب";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "صيغة البريد غير صالحة";

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) fieldErrors.full_name = "الاسم مطلوب";

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) fieldErrors.phone = "رقم الواتساب مطلوب";
  else if (normalizePhone(phone).length < 7)
    fieldErrors.phone = "رقم غير صالح";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const admin = createServiceRoleClient();

  // 1) Create the auth user (silent — no invite email)
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name },
    });

  if (createError || !created.user) {
    const msg = (createError?.message ?? "").toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("duplicate")
    ) {
      return { fieldErrors: { email: "هذا الإيميل مسجل مسبقاً" } };
    }
    return { error: createError?.message ?? "تعذّر إنشاء الحساب" };
  }

  const userId = created.user.id;

  // 2) Populate the profile (the handle_new_user trigger created the row)
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name, phone, role: "client" })
    .eq("id", userId);

  if (profileError) {
    return { error: `الحساب اتعمل لكن البروفايل فشل: ${profileError.message}` };
  }

  // 3) Auto-link any orphan bookings whose phone matches this new client
  const normalized = normalizePhone(phone);
  if (normalized.length >= 7) {
    const { data: orphans } = await admin
      .from("bookings")
      .select("id, client_phone")
      .is("client_id", null);

    const toLink = (orphans ?? [])
      .filter(
        (b) =>
          b.client_phone && normalizePhone(b.client_phone) === normalized,
      )
      .map((b) => b.id);

    if (toLink.length > 0) {
      await admin
        .from("bookings")
        .update({ client_id: userId })
        .in("id", toLink);
    }
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  redirect("/admin/clients");
}

export async function updateClient(
  clientId: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const fieldErrors: Record<string, string> = {};

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) fieldErrors.full_name = "الاسم مطلوب";

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) fieldErrors.phone = "رقم الواتساب مطلوب";
  else if (normalizePhone(phone).length < 7)
    fieldErrors.phone = "رقم غير صالح";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", clientId);

  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect("/admin/clients");
}

export async function deleteClient(
  clientId: string,
): Promise<{ error?: string }> {
  const admin = createServiceRoleClient();
  // Deleting the auth user cascades to profiles.id (FK with ON DELETE CASCADE)
  // and sets bookings.client_id to NULL (per migration 0005).
  const { error } = await admin.auth.admin.deleteUser(clientId);
  if (error) return { error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return {};
}
