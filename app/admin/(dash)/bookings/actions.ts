"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { bookingCountsAsTaken } from "@/lib/bookings";
import type { BookingStatus, CurrencyCode } from "@/lib/supabase/types";

export type BookingFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const VALID_STATUSES: BookingStatus[] = [
  "pending_deposit",
  "deposit_paid",
  "paid_full",
  "cancelled",
];

const VALID_CURRENCIES: CurrencyCode[] = ["ILS", "USD"];

type BookingPayload = {
  trip_id: string;
  status: BookingStatus;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  currency: CurrencyCode;
  notes: string | null;
  admin_notes: string | null;
};

function payloadFromForm(formData: FormData): {
  payload?: BookingPayload;
  fieldErrors?: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const trip_id = String(formData.get("trip_id") ?? "").trim();
  if (!trip_id) fieldErrors.trip_id = "اختاري الرحلة";

  const statusRaw = String(formData.get("status") ?? "");
  const status = VALID_STATUSES.includes(statusRaw as BookingStatus)
    ? (statusRaw as BookingStatus)
    : null;
  if (!status) fieldErrors.status = "حالة غير صالحة";

  const currencyRaw = String(formData.get("currency") ?? "USD");
  const currency = VALID_CURRENCIES.includes(currencyRaw as CurrencyCode)
    ? (currencyRaw as CurrencyCode)
    : "USD";

  const client_name =
    String(formData.get("client_name") ?? "").trim() || null;
  const client_phone =
    String(formData.get("client_phone") ?? "").trim() || null;
  const client_email =
    String(formData.get("client_email") ?? "").trim() || null;

  if (!client_name) fieldErrors.client_name = "اسم العميلة مطلوب";
  if (!client_phone) fieldErrors.client_phone = "رقم الواتساب مطلوب";

  const total_amount = Number(formData.get("total_amount") ?? 0);
  if (isNaN(total_amount) || total_amount < 0)
    fieldErrors.total_amount = "المبلغ الإجمالي غير صالح";

  const deposit_amount = Number(formData.get("deposit_amount") ?? 0);
  if (isNaN(deposit_amount) || deposit_amount < 0)
    fieldErrors.deposit_amount = "المقدّم غير صالح";

  const paid_amount = Number(formData.get("paid_amount") ?? 0);
  if (isNaN(paid_amount) || paid_amount < 0)
    fieldErrors.paid_amount = "المدفوع غير صالح";
  if (paid_amount > total_amount && total_amount > 0)
    fieldErrors.paid_amount = "المدفوع لا يمكن أن يتجاوز الإجمالي";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (!status) return { fieldErrors };

  return {
    payload: {
      trip_id,
      status,
      client_id: null, // until OTP launches
      client_name,
      client_phone,
      client_email,
      total_amount,
      deposit_amount,
      paid_amount,
      currency,
      notes: String(formData.get("notes") ?? "").trim() || null,
      admin_notes: String(formData.get("admin_notes") ?? "").trim() || null,
    },
  };
}

/**
 * Adjusts trip.available_spots by `delta` (clamped to [0, total_spots]).
 * Uses an RPC-style update via a single SQL statement to avoid races.
 */
async function adjustTripSpots(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tripId: string,
  delta: number,
) {
  if (delta === 0) return;
  const { data: trip } = await supabase
    .from("trips")
    .select("available_spots, total_spots")
    .eq("id", tripId)
    .single();
  if (!trip) return;
  const next = Math.max(
    0,
    Math.min(trip.total_spots, trip.available_spots + delta),
  );
  if (next === trip.available_spots) return;
  await supabase
    .from("trips")
    .update({ available_spots: next })
    .eq("id", tripId);
}

export async function createBooking(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const { payload, fieldErrors } = payloadFromForm(formData);
  if (fieldErrors) return { fieldErrors };
  if (!payload) return { error: "بيانات الفورم غير مكتملة" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("bookings").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return { error: "هذا الحجز موجود مسبقاً" };
    }
    return { error: error.message };
  }

  // If the booking is already active, decrement the trip's available spots
  if (bookingCountsAsTaken(payload.status)) {
    await adjustTripSpots(supabase, payload.trip_id, -1);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/bookings");
}

export async function updateBooking(
  bookingId: string,
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const { payload, fieldErrors } = payloadFromForm(formData);
  if (fieldErrors) return { fieldErrors };
  if (!payload) return { error: "بيانات الفورم غير مكتملة" };

  const supabase = await createServerSupabaseClient();

  // Fetch the previous status + trip so we know if spots need adjusting
  const { data: prev } = await supabase
    .from("bookings")
    .select("status, trip_id")
    .eq("id", bookingId)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update(payload)
    .eq("id", bookingId);

  if (error) return { error: error.message };

  // Reconcile trip spots based on the status transition.
  if (prev) {
    const wasTaken = bookingCountsAsTaken(prev.status);
    const isTaken = bookingCountsAsTaken(payload.status);
    const sameTrip = prev.trip_id === payload.trip_id;

    if (sameTrip) {
      if (wasTaken && !isTaken) {
        await adjustTripSpots(supabase, payload.trip_id, +1);
      } else if (!wasTaken && isTaken) {
        await adjustTripSpots(supabase, payload.trip_id, -1);
      }
    } else {
      // Booking moved to a different trip
      if (wasTaken) await adjustTripSpots(supabase, prev.trip_id, +1);
      if (isTaken) await adjustTripSpots(supabase, payload.trip_id, -1);
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/bookings");
}

export async function deleteBooking(
  bookingId: string,
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();

  // Fetch previous state so we know whether to restore the spot
  const { data: prev } = await supabase
    .from("bookings")
    .select("status, trip_id")
    .eq("id", bookingId)
    .single();

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) return { error: error.message };

  if (prev && bookingCountsAsTaken(prev.status)) {
    await adjustTripSpots(supabase, prev.trip_id, +1);
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}
