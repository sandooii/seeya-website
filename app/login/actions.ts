"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// Step 1 — Request OTP (send a 6-digit code to the user's email)
// ─────────────────────────────────────────────────────────────

export type RequestOtpState = {
  error?: string;
  /** true once the code has been sent. The form pivots to the code-entry UI. */
  sent?: boolean;
  /** Echoed back so the code-entry form knows which email to verify. */
  email?: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function requestOtp(
  _prev: RequestOtpState,
  formData: FormData,
): Promise<RequestOtpState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { error: "البريد الإلكتروني مطلوب" };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "البريد الإلكتروني غير صالح" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Invitation-only: SeeYa admin pre-registers each client's email.
      // Random visitors who try to sign up get a friendly "no account" message.
      shouldCreateUser: false,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("too many")) {
      return { error: "كثرتي طلب الكود — انتظري دقيقة وحاولي مرة ثانية" };
    }
    if (
      msg.includes("signups not allowed") ||
      msg.includes("not found") ||
      msg.includes("not allowed for otp")
    ) {
      return {
        error:
          "ما لقينا حساب بهالإيميل — تواصلي معنا على واتساب وبنفتحلك حساب",
      };
    }
    return { error: "تعذّر إرسال الكود — حاولي مرة ثانية" };
  }

  return { sent: true, email };
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Verify the code and redirect into /account
// ─────────────────────────────────────────────────────────────

export type VerifyOtpState = {
  error?: string;
};

export async function verifyOtp(
  _prev: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const token = String(formData.get("token") ?? "").trim();
  const next = String(formData.get("next") ?? "/account");

  if (!email || !token) {
    return { error: "أدخلي الكود كامل" };
  }
  if (!/^\d{6}$/.test(token)) {
    return { error: "الكود لازم يكون 6 أرقام" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("expired")) {
      return { error: "انتهت صلاحية الكود — اطلبي كود جديد" };
    }
    if (msg.includes("invalid") || msg.includes("token")) {
      return { error: "الكود غير صحيح. تأكدي وأعيدي." };
    }
    return { error: error.message };
  }

  // Check if the user has completed her profile (name + phone).
  // The OTP signup creates a profile via the handle_new_user trigger,
  // but full_name/phone start empty — collect them in /account/welcome.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, role")
      .eq("id", user.id)
      .single();

    // Admin users shouldn't end up in /account by accident
    const safeNext =
      profile?.role === "admin" && next.startsWith("/account")
        ? "/admin"
        : next;

    if (!profile?.full_name?.trim() || !profile?.phone?.trim()) {
      redirect(`/account/welcome?next=${encodeURIComponent(safeNext)}`);
    }

    redirect(safeNext);
  }

  redirect(next);
}
