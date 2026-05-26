/**
 * PDF storage helpers — for trip program PDFs in Supabase Storage.
 *
 * Files live in the public `trip-pdfs` bucket. The `trips.pdf_path`
 * column stores a storage key (e.g., "thailand.pdf"); use
 * `getTripPdfUrl()` to convert it to a fetchable URL.
 */

import { createBrowserClient } from "@supabase/ssr";

export const TRIP_PDFS_BUCKET = "trip-pdfs";

/** 10 MB — matches the file_size_limit on the bucket. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Storage key for a trip's PDF. Using the trip's UUID keeps the path
 * stable across slug renames, and one file per trip is enough.
 */
export function tripPdfKey(tripId: string): string {
  return `${tripId}.pdf`;
}

/**
 * Resolve a `pdf_path` to a fetchable URL.
 *
 * Two shapes are accepted:
 *   - Absolute / static — starts with "/" (e.g. "/thailand-program.pdf")
 *     → resolved against the site root, served from /public.
 *     This covers PDFs that pre-date the Supabase Storage flow.
 *   - Storage key — e.g. "<trip-uuid>.pdf"
 *     → resolved to the public URL of the trip-pdfs bucket.
 *
 * Returns null when path is empty/null. Adds a `?v=` cachebuster so
 * replacing the file invalidates browser caches.
 */
export function getTripPdfUrl(
  path: string | null | undefined,
  version?: string,
): string | null {
  if (!path) return null;

  // Legacy / static asset — served from /public. The leading slash is
  // preserved so the browser fetches it from the same origin.
  if (path.startsWith("/")) {
    return version ? `${path}?v=${encodeURIComponent(version)}` : path;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    console.warn("[pdfs] NEXT_PUBLIC_SUPABASE_URL is missing");
    return null;
  }
  // Construct the public URL manually — same shape as
  // supabase.storage.getPublicUrl(path).data.publicUrl but doesn't
  // require an SDK call. This is safe because the bucket is public.
  const url = `${base}/storage/v1/object/public/${TRIP_PDFS_BUCKET}/${encodeURIComponent(path)}`;
  return version ? `${url}?v=${encodeURIComponent(version)}` : url;
}

/** Human-friendly filename extracted from a storage key. */
export function extractPdfFilename(path: string | null | undefined): string {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

// ─────────────────────────────────────────────────────────────
// Browser-side mutation helpers (used by the PdfUpload component)
// ─────────────────────────────────────────────────────────────

function browserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    );
  }
  return createBrowserClient(url, key);
}

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

/**
 * Upload a PDF for a trip. Overwrites any existing file at the same
 * key. Validates client-side that it's a PDF under the size cap.
 */
export async function uploadTripPdf(
  tripId: string,
  file: File,
): Promise<UploadResult> {
  if (file.type !== "application/pdf") {
    return { ok: false, error: "نوع الملف لازم يكون PDF" };
  }
  if (file.size > MAX_PDF_BYTES) {
    return {
      ok: false,
      error: `حجم الملف لازم يكون أقل من ${(MAX_PDF_BYTES / 1024 / 1024).toFixed(0)} MB`,
    };
  }

  const supabase = browserClient();
  const key = tripPdfKey(tripId);

  const { error } = await supabase.storage
    .from(TRIP_PDFS_BUCKET)
    .upload(key, file, {
      contentType: "application/pdf",
      upsert: true,
      cacheControl: "3600",
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true, path: key };
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

/**
 * Delete the PDF for a trip. Safe to call even if no file exists.
 */
export async function deleteTripPdf(tripId: string): Promise<DeleteResult> {
  const supabase = browserClient();
  const key = tripPdfKey(tripId);

  const { error } = await supabase.storage
    .from(TRIP_PDFS_BUCKET)
    .remove([key]);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
