"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { WaitlistStatus } from "@/lib/supabase/types";

export type WaitlistFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const VALID_STATUSES: WaitlistStatus[] = [
  "waiting",
  "offered",
  "converted",
  "declined",
  "cancelled",
];

type WaitlistPayload = {
  trip_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: WaitlistStatus;
};

function payloadFromForm(formData: FormData): {
  payload?: WaitlistPayload;
  fieldErrors?: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const trip_id = String(formData.get("trip_id") ?? "").trim();
  if (!trip_id) fieldErrors.trip_id = "اختاري الرحلة";

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) fieldErrors.full_name = "الاسم مطلوب";

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) fieldErrors.phone = "الواتساب مطلوب";

  const statusRaw = String(formData.get("status") ?? "waiting");
  const status = VALID_STATUSES.includes(statusRaw as WaitlistStatus)
    ? (statusRaw as WaitlistStatus)
    : null;
  if (!status) fieldErrors.status = "حالة غير صالحة";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (!status) return { fieldErrors };

  return {
    payload: {
      trip_id,
      full_name,
      phone,
      email: String(formData.get("email") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      status,
    },
  };
}

export async function createWaitlistEntry(
  _prev: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const { payload, fieldErrors } = payloadFromForm(formData);
  if (fieldErrors) return { fieldErrors };
  if (!payload) return { error: "بيانات الفورم غير مكتملة" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("waitlist").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/admin/waitlist");
  revalidatePath("/admin");
  redirect("/admin/waitlist");
}

export async function updateWaitlistEntry(
  id: string,
  _prev: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const { payload, fieldErrors } = payloadFromForm(formData);
  if (fieldErrors) return { fieldErrors };
  if (!payload) return { error: "بيانات الفورم غير مكتملة" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("waitlist")
    .update(payload)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/waitlist");
  revalidatePath(`/admin/waitlist/${id}`);
  revalidatePath("/admin");
  redirect("/admin/waitlist");
}

export async function deleteWaitlistEntry(
  id: string,
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("waitlist").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/waitlist");
  revalidatePath("/admin");
  return {};
}

/**
 * Set a waitlist entry's status without going through the full form.
 * Used by inline status-change buttons in the list view.
 */
export async function setWaitlistStatus(
  id: string,
  status: WaitlistStatus,
): Promise<{ error?: string }> {
  if (!VALID_STATUSES.includes(status)) {
    return { error: "حالة غير صالحة" };
  }
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("waitlist")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/waitlist");
  revalidatePath("/admin");
  return {};
}

/**
 * Convert a waitlist entry into a pending_deposit booking. Copies
 * client info + trip into the new booking, then marks the waitlist
 * entry as 'converted' and links converted_to_booking_id.
 *
 * Pulls the trip's price + currency at conversion time so the booking
 * has an authoritative total to work from. Admin can edit later.
 */
export async function convertWaitlistToBooking(
  waitlistId: string,
): Promise<{ error?: string; bookingId?: string }> {
  const supabase = await createServerSupabaseClient();

  const { data: entry, error: readError } = await supabase
    .from("waitlist")
    .select("*")
    .eq("id", waitlistId)
    .single();

  if (readError || !entry) {
    return { error: readError?.message ?? "لم نجد إدخال قائمة الانتظار" };
  }

  if (entry.status === "converted" && entry.converted_to_booking_id) {
    return {
      error: "هذا الإدخال محوّل لحجز موجود مسبقاً",
      bookingId: entry.converted_to_booking_id,
    };
  }

  // Fetch the trip so we can prefill amount + currency
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, price, currency")
    .eq("id", entry.trip_id)
    .single();

  if (tripError || !trip) {
    return { error: tripError?.message ?? "لم نجد بيانات الرحلة" };
  }

  // Create the booking
  const { data: newBooking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      trip_id: trip.id,
      client_id: null,
      client_name: entry.full_name,
      client_phone: entry.phone,
      client_email: entry.email,
      status: "pending_deposit",
      total_amount: Number(trip.price),
      deposit_amount: 0,
      paid_amount: 0,
      currency: trip.currency,
      notes: entry.notes,
      admin_notes: `تحوّل من قائمة الانتظار — ${new Date().toISOString().slice(0, 10)}`,
    })
    .select("id")
    .single();

  if (bookingError || !newBooking) {
    return { error: bookingError?.message ?? "فشل إنشاء الحجز" };
  }

  // Mark waitlist entry as converted, link it
  const { error: updateError } = await supabase
    .from("waitlist")
    .update({
      status: "converted",
      converted_to_booking_id: newBooking.id,
    })
    .eq("id", waitlistId);

  if (updateError) {
    return {
      error: `الحجز اتعمل لكن فشل تحديث قائمة الانتظار: ${updateError.message}`,
      bookingId: newBooking.id,
    };
  }

  revalidatePath("/admin/waitlist");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { bookingId: newBooking.id };
}
