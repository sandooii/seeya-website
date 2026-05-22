"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CurrencyCode,
  TripStatusDB,
  TripItineraryItem,
} from "@/lib/supabase/types";

export type TripFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const VALID_STATUSES: TripStatusDB[] = [
  "live",
  "open",
  "soon",
  "completed",
  "sold-out",
];

const VALID_CURRENCIES: CurrencyCode[] = ["ILS", "USD"];

/**
 * Parse a list-of-strings field that's submitted as one item per line.
 * Empty lines are stripped.
 */
function parseLines(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse itinerary submitted as JSON in a textarea.
 * Returns [] if blank or invalid.
 */
function parseItinerary(raw: FormDataEntryValue | null): TripItineraryItem[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (it) =>
          it &&
          typeof it === "object" &&
          typeof it.day === "string" &&
          typeof it.title === "string" &&
          typeof it.desc === "string",
      )
      .map((it) => ({
        day: it.day,
        title: it.title,
        desc: it.desc,
      }));
  } catch {
    return [];
  }
}

/**
 * Build the trip row payload from a FormData. Returns either the
 * payload or a field-error map.
 */
function payloadFromForm(formData: FormData): {
  payload?: {
    slug: string;
    name: string;
    country: string;
    month: string;
    start_date: string | null;
    end_date: string | null;
    duration: string;
    price: number;
    currency: CurrencyCode;
    total_spots: number;
    available_spots: number;
    status: TripStatusDB;
    badge: string;
    image_url: string;
    blurb: string;
    includes: string[];
    itinerary: TripItineraryItem[];
    price_subtitle: string | null;
    deposit: string | null;
    deadline: string | null;
    sort_order: number;
  };
  fieldErrors?: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) fieldErrors.slug = "الـ slug مطلوب";
  else if (!/^[a-z0-9-]+$/.test(slug))
    fieldErrors.slug = "حروف صغيرة وأرقام وشرطات (-) فقط";

  const name = String(formData.get("name") ?? "").trim();
  if (!name) fieldErrors.name = "اسم الرحلة مطلوب";

  const country = String(formData.get("country") ?? "").trim();
  if (!country) fieldErrors.country = "البلد مطلوب";

  const month = String(formData.get("month") ?? "").trim();
  if (!month) fieldErrors.month = "تاريخ العرض مطلوب";

  const duration = String(formData.get("duration") ?? "").trim();
  if (!duration) fieldErrors.duration = "المدة مطلوبة";

  const statusRaw = String(formData.get("status") ?? "");
  const status = VALID_STATUSES.includes(statusRaw as TripStatusDB)
    ? (statusRaw as TripStatusDB)
    : null;
  if (!status) fieldErrors.status = "حالة غير صالحة";

  const badge = String(formData.get("badge") ?? "").trim();
  if (!badge) fieldErrors.badge = "نص الشارة مطلوب";

  const imageUrl = String(formData.get("image_url") ?? "").trim();
  if (!imageUrl) fieldErrors.image_url = "رابط الصورة مطلوب";

  const blurb = String(formData.get("blurb") ?? "").trim();
  if (!blurb) fieldErrors.blurb = "الوصف مطلوب";

  const currencyRaw = String(formData.get("currency") ?? "ILS");
  const currency = VALID_CURRENCIES.includes(currencyRaw as CurrencyCode)
    ? (currencyRaw as CurrencyCode)
    : "ILS";

  const price = Number(formData.get("price") ?? 0);
  if (isNaN(price) || price < 0) fieldErrors.price = "السعر غير صالح";

  const totalSpots = Number(formData.get("total_spots") ?? 0);
  if (isNaN(totalSpots) || totalSpots < 0)
    fieldErrors.total_spots = "عدد المقاعد غير صالح";

  const availableSpots = Number(formData.get("available_spots") ?? 0);
  if (isNaN(availableSpots) || availableSpots < 0)
    fieldErrors.available_spots = "المقاعد المتاحة غير صالحة";
  if (availableSpots > totalSpots)
    fieldErrors.available_spots = "المتاحة لا تقدر تزيد عن المجموع";

  const sortOrder = Number(formData.get("sort_order") ?? 0);

  const startDateRaw = String(formData.get("start_date") ?? "").trim();
  const endDateRaw = String(formData.get("end_date") ?? "").trim();

  const includes = parseLines(formData.get("includes"));
  const itinerary = parseItinerary(formData.get("itinerary"));

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (!status) return { fieldErrors }; // narrowing

  return {
    payload: {
      slug,
      name,
      country,
      month,
      start_date: startDateRaw || null,
      end_date: endDateRaw || null,
      duration,
      price,
      currency,
      total_spots: totalSpots,
      available_spots: availableSpots,
      status,
      badge,
      image_url: imageUrl,
      blurb,
      includes,
      itinerary,
      price_subtitle:
        String(formData.get("price_subtitle") ?? "").trim() || null,
      deposit: String(formData.get("deposit") ?? "").trim() || null,
      deadline: String(formData.get("deadline") ?? "").trim() || null,
      // pdf_path is managed by PdfUpload via setTripPdfPath — not via this form
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
    },
  };
}

export async function createTrip(
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const { payload, fieldErrors } = payloadFromForm(formData);
  if (fieldErrors) return { fieldErrors };
  if (!payload) return { error: "بيانات الفورم غير مكتملة" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("trips").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return {
        fieldErrors: { slug: "هذا الـ slug موجود بالفعل" },
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/trips");
  revalidatePath("/");
  redirect("/admin/trips");
}

export async function updateTrip(
  tripId: string,
  _prev: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const { payload, fieldErrors } = payloadFromForm(formData);
  if (fieldErrors) return { fieldErrors };
  if (!payload) return { error: "بيانات الفورم غير مكتملة" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("trips")
    .update(payload)
    .eq("id", tripId);

  if (error) {
    if (error.code === "23505") {
      return {
        fieldErrors: { slug: "هذا الـ slug موجود بالفعل" },
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/trips");
  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath("/");
  redirect("/admin/trips");
}

export async function deleteTrip(tripId: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) {
    // FK violation if bookings reference it
    if (error.code === "23503") {
      return {
        error: "لا يمكن حذف هذه الرحلة لوجود حجوزات مرتبطة بها",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/trips");
  revalidatePath("/");
  return {};
}

/**
 * Persist a PDF storage path onto a trip row (or clear it).
 * Called by the PdfUpload component after a successful upload/delete
 * so the change is reflected immediately without requiring a full
 * form submit.
 */
export async function setTripPdfPath(
  tripId: string,
  path: string | null,
): Promise<{ error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("trips")
    .update({ pdf_path: path })
    .eq("id", tripId);

  if (error) return { error: error.message };

  revalidatePath("/admin/trips");
  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath("/admin/pdfs");
  revalidatePath("/");
  return {};
}
