"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createServerSupabaseClient,
  createServiceRoleClient,
} from "@/lib/supabase/server";
import { bookingCountsAsTaken } from "@/lib/bookings";
import { normalizePhone, resolveAuthEmail } from "@/lib/auth-helpers";
import type {
  BookingFlightOverride,
  BookingStatus,
  CurrencyCode,
  FlightInfo,
} from "@/lib/supabase/types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
  flight_override: BookingFlightOverride | null;
};

/**
 * Parse the hidden `flight_override` field. Returns null when the field is
 * empty, malformed, or contains no actual flight data (so we don't store
 * `{}` blobs in the DB). Strips empty strings from FlightInfo values.
 */
function parseFlightOverride(raw: string): BookingFlightOverride | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object") return null;
    const cleanSide = (side: unknown): FlightInfo | undefined => {
      if (!side || typeof side !== "object") return undefined;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(side as Record<string, unknown>)) {
        if (typeof v === "string" && v.trim()) out[k] = v;
      }
      return Object.keys(out).length > 0 ? (out as FlightInfo) : undefined;
    };
    const result: BookingFlightOverride = {};
    const outbound = cleanSide((parsed as Record<string, unknown>).outbound);
    const ret = cleanSide((parsed as Record<string, unknown>).return_flight);
    if (outbound) result.outbound = outbound;
    if (ret) result.return_flight = ret;
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

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
  const client_id_raw = String(formData.get("client_id") ?? "").trim();
  const client_id = client_id_raw || null;

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

  const flight_override = parseFlightOverride(
    String(formData.get("flight_override") ?? ""),
  );

  return {
    payload: {
      trip_id,
      status,
      // Optional FK to profiles.id — set when admin links this booking
      // to a registered client. Falls back to inline name/phone fields
      // for manual WhatsApp bookings with no client account yet.
      client_id,
      client_name,
      client_phone,
      client_email,
      total_amount,
      deposit_amount,
      paid_amount,
      currency,
      notes: String(formData.get("notes") ?? "").trim() || null,
      admin_notes: String(formData.get("admin_notes") ?? "").trim() || null,
      flight_override,
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

export type ConvertBookingResult = {
  ok?: boolean;
  error?: string;
  /** What the client should type into /login's "username" field —
   *  her real email if she has one, otherwise her phone digits. */
  loginUsername?: string;
  /** Password to share with the client (= phone digits). */
  password?: string;
  /** Number of additional orphan bookings linked by phone match. */
  linkedExtra?: number;
};

/**
 * Promote an inline-only booking into a real client account.
 *
 * - Creates the auth user with password = phone digits
 * - Creates the profile (trigger does this, we just update full_name + phone)
 * - Links this booking + any other orphan bookings with the same phone
 *
 * No-ops if the booking is already linked. Returns the email/password
 * combo so the admin can WhatsApp them to the client.
 */
export async function convertBookingToClient(
  bookingId: string,
): Promise<ConvertBookingResult> {
  const supabase = await createServerSupabaseClient();
  const admin = createServiceRoleClient();

  const { data: booking, error: readError } = await supabase
    .from("bookings")
    .select("id, client_id, client_name, client_phone, client_email")
    .eq("id", bookingId)
    .single();

  if (readError || !booking) {
    return { error: readError?.message ?? "ما لقينا الحجز" };
  }

  if (booking.client_id) {
    return { error: "هاي العميلة عندها حساب مربوط بهذا الحجز مسبقاً" };
  }

  const rawEmail = (booking.client_email ?? "").trim().toLowerCase();
  const phone = (booking.client_phone ?? "").trim();
  const fullName = (booking.client_name ?? "").trim();

  if (rawEmail && !EMAIL_RE.test(rawEmail)) {
    return { error: "صيغة الإيميل غير صالحة" };
  }
  if (!phone || normalizePhone(phone).length < 7) {
    return { error: "رقم تلفون العميلة غير صالح" };
  }

  const password = normalizePhone(phone);
  const authEmail = resolveAuthEmail(rawEmail, phone);
  if (!authEmail) {
    return { error: "تعذّر تكوين بيانات الحساب — تأكدي من الرقم" };
  }

  // Create the auth user. Trigger auto-creates the profile.
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    const msg = (createError?.message ?? "").toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("duplicate")
    ) {
      return {
        error:
          "هذا الإيميل مسجل مسبقاً — روحي على /admin/clients واربطي الحجز يدوياً من فورم التعديل.",
      };
    }
    return { error: createError?.message ?? "تعذّر إنشاء الحساب" };
  }

  const userId = created.user.id;

  // Populate the profile row. profile.email only stores real addresses.
  const profileEmail = rawEmail || null;
  await admin
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      email: profileEmail,
      role: "client",
    })
    .eq("id", userId);

  // Link THIS booking to the new account
  await admin
    .from("bookings")
    .update({ client_id: userId })
    .eq("id", booking.id);

  // Link any OTHER orphan bookings whose phone matches
  const { data: orphans } = await admin
    .from("bookings")
    .select("id, client_phone")
    .is("client_id", null)
    .neq("id", booking.id);

  const toLink = (orphans ?? [])
    .filter(
      (b) =>
        b.client_phone && normalizePhone(b.client_phone) === password,
    )
    .map((b) => b.id);

  if (toLink.length > 0) {
    await admin
      .from("bookings")
      .update({ client_id: userId })
      .in("id", toLink);
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/clients");
  revalidatePath("/admin");

  return {
    ok: true,
    // Use the real email for login if she has one; otherwise her phone
    // digits (which our /login handler maps to the synthetic email).
    loginUsername: rawEmail || password,
    password,
    linkedExtra: toLink.length,
  };
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
