"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import {
  normalizePhone,
  resolveAuthEmail,
  isInternalEmail,
} from "@/lib/auth-helpers";

export type ClientFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Create an auth user for a client + populate her profile row.
 * Called from /admin/clients/new.
 *
 * **Email is OPTIONAL** — if admin doesn't provide one, we use
 * `<phone-digits>@seeya.app` so Supabase has a unique key. The
 * client never sees that internal email; she logs in with her
 * phone number as username + her phone number as password.
 */
export async function inviteClient(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const fieldErrors: Record<string, string> = {};

  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  // Email is now optional — only validate format if provided.
  if (rawEmail && !EMAIL_RE.test(rawEmail))
    fieldErrors.email = "صيغة البريد غير صالحة";

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) fieldErrors.full_name = "الاسم مطلوب";

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) fieldErrors.phone = "رقم الواتساب مطلوب";
  else if (normalizePhone(phone).length < 7)
    fieldErrors.phone = "رقم غير صالح";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const admin = createServiceRoleClient();

  // Password = phone number digits only — easy for client to remember
  // and easy for admin to communicate via WhatsApp.
  const password = normalizePhone(phone);

  // Resolve the email Supabase will store on auth.users
  const authEmail = resolveAuthEmail(rawEmail, phone);
  if (!authEmail) {
    return { error: "تعذّر تكوين بيانات الحساب — تأكدي من الرقم" };
  }

  // 1) Create the auth user with the password (silent — no invite email)
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: authEmail,
      password,
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
      return {
        fieldErrors: {
          [rawEmail ? "email" : "phone"]: rawEmail
            ? "هذا الإيميل مسجل مسبقاً"
            : "في حساب مسجل بنفس رقم التلفون — استخدمي رقم تاني",
        },
      };
    }
    return { error: createError?.message ?? "تعذّر إنشاء الحساب" };
  }

  const userId = created.user.id;

  // 2) Populate the profile. profile.email stores only REAL emails —
  //    we don't surface the synthetic <phone>@seeya.app value to admin
  //    or to the client.
  const profileEmail = rawEmail || null;
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name,
      phone,
      email: profileEmail,
      role: "client",
    })
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

  // Keep the auth password + synthetic email in sync with the new phone.
  // If the client's profile.email is a real address we leave the auth
  // email alone; if she has no real email, the auth email is the
  // synthetic <phone>@seeya.app and needs to track phone changes.
  const password = normalizePhone(phone);
  if (password.length >= 7) {
    const admin = createServiceRoleClient();

    const { data: authUser } = await admin.auth.admin.getUserById(clientId);
    const currentAuthEmail = authUser?.user?.email ?? null;

    const updates: { password: string; email?: string } = { password };
    if (isInternalEmail(currentAuthEmail)) {
      updates.email = resolveAuthEmail(null, phone) ?? undefined;
    }

    await admin.auth.admin.updateUserById(clientId, updates);
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect("/admin/clients");
}

/**
 * Reset a client's password to her current phone number. Useful when
 * the client forgets, or after an admin manually changes her phone
 * elsewhere. Doesn't change anything else.
 */
export async function resetClientPasswordToPhone(
  clientId: string,
): Promise<{ error?: string; password?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", clientId)
    .single();

  if (readError || !profile?.phone) {
    return { error: "ما لقينا رقم العميلة — أضيفي رقم أولاً" };
  }

  const password = normalizePhone(profile.phone);
  if (password.length < 7) {
    return { error: "رقم التلفون قصير — صحّحيه أولاً" };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.updateUserById(clientId, {
    password,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return { password };
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
