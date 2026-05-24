"use server";

import { revalidatePath } from "next/cache";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import {
  isInternalEmail,
  normalizePhone,
  resolveAuthEmail,
} from "@/lib/auth-helpers";

export type ProfileFormState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string>;
};

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

  // 1) Update the profile row (RLS-safe, runs as the caller).
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // 2) Keep auth.users in sync with the new phone. The convention across
  //    SeeYa is `password = phone digits` and (when the client has no
  //    real email) `email = <digits>@seeya.app`. If we update profiles
  //    but not auth.users, the next login fails because Supabase still
  //    expects the OLD digits as username + password.
  //
  //    This mirrors the admin-side updateClient logic in
  //    app/admin/(dash)/clients/actions.ts. It MUST use the service-role
  //    client because auth.users mutation requires admin privileges.
  const newDigits = normalizePhone(phone);
  if (newDigits.length >= 7) {
    const admin = createServiceRoleClient();
    const { data: authUser } = await admin.auth.admin.getUserById(user.id);
    const currentAuthEmail = authUser?.user?.email ?? null;

    const updates: { password: string; email?: string } = {
      password: newDigits,
    };
    // Only rewrite the email when it's the synthetic placeholder; never
    // overwrite a real address the client gave us.
    if (isInternalEmail(currentAuthEmail)) {
      updates.email = resolveAuthEmail(null, phone) ?? undefined;
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      user.id,
      updates,
    );
    // Auth update is best-effort: the profile row is already saved. We
    // surface the error so the client knows to ping support, but we
    // don't roll back her name change.
    if (authError) {
      return {
        error: `تم حفظ الاسم لكن في مشكلة بمزامنة الرقم — كلمينا: ${authError.message}`,
      };
    }
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { success: true };
}
