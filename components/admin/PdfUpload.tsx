"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import {
  uploadTripPdf,
  deleteTripPdf,
  getTripPdfUrl,
  MAX_PDF_BYTES,
} from "@/lib/pdfs";
import { setTripPdfPath } from "@/app/admin/(dash)/trips/actions";

type Status = "idle" | "uploading" | "success" | "error";

export default function PdfUpload({
  tripId,
  tripName,
  currentPath,
  updatedAt,
}: {
  /** UUID of the trip — required to upload (we name files by trip id). */
  tripId: string | null;
  tripName?: string;
  /** Current pdf_path on the trip row (storage key). */
  currentPath: string | null;
  /** Trip updated_at — used as the cache-buster version. */
  updatedAt?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const disabled = !tripId;
  const pdfUrl = getTripPdfUrl(currentPath, updatedAt);

  const handleFile = async (file: File) => {
    if (!tripId) return;

    setStatus("uploading");
    setMessage(null);

    const result = await uploadTripPdf(tripId, file);

    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }

    const updateResult = await setTripPdfPath(tripId, result.path);
    if (updateResult.error) {
      setStatus("error");
      setMessage(`تم الرفع، لكن فشل تحديث الرحلة: ${updateResult.error}`);
      return;
    }

    setStatus("success");
    setMessage("تم رفع الملف بنجاح ✓");
    startTransition(() => router.refresh());
  };

  const handleDelete = async () => {
    if (!tripId) return;
    if (!confirm("متأكدة من حذف ملف البرنامج؟")) return;

    setStatus("uploading");
    setMessage(null);

    const result = await deleteTripPdf(tripId);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }

    const updateResult = await setTripPdfPath(tripId, null);
    if (updateResult.error) {
      setStatus("error");
      setMessage(`تم حذف الملف، لكن فشل تحديث الرحلة: ${updateResult.error}`);
      return;
    }

    setStatus("idle");
    setMessage("تم حذف الملف");
    startTransition(() => router.refresh());
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Allow re-picking the same file later
    e.target.value = "";
  };

  // ─── DISABLED state (new trip — no ID yet) ───
  if (disabled) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-ink/3 p-5 text-center">
        <FileText size={32} className="mx-auto mb-2 text-ink/30" />
        <p className="text-sm text-ink/60">
          احفظي الرحلة أولاً، وبعدها بترجعي تعدّليها لرفع PDF
        </p>
      </div>
    );
  }

  // ─── HAS FILE state ───
  if (currentPath && pdfUrl) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
            <FileText size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-emerald-700 text-sm font-bold">
              <CheckCircle2 size={14} />
              <span>ملف البرنامج مرفوع</span>
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-coral mt-0.5"
            >
              <ExternalLink size={11} />
              فتح / تنزيل
            </a>
          </div>
          <div className="flex items-center gap-2">
            <label
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-ink/10 text-ink text-xs font-bold hover:bg-ink/5 cursor-pointer"
              aria-disabled={status === "uploading"}
            >
              <RotateCcw size={14} />
              <span>استبدال</span>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onPickFile}
                disabled={status === "uploading"}
              />
            </label>
            <button
              type="button"
              onClick={handleDelete}
              disabled={status === "uploading"}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>حذف</span>
            </button>
          </div>
        </div>
        <StatusLine status={status} message={message} />
      </div>
    );
  }

  // ─── EMPTY state — show upload dropzone ───
  return (
    <label
      className={`block rounded-2xl border-2 border-dashed bg-coral/4 hover:bg-coral/8 transition-colors cursor-pointer p-6 text-center ${
        status === "uploading"
          ? "border-coral/40 pointer-events-none"
          : "border-coral/30"
      }`}
    >
      {status === "uploading" ? (
        <div className="flex flex-col items-center gap-2 text-coral">
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm font-bold">جاري الرفع...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-coral/15 text-coral grid place-items-center">
            <Upload size={20} />
          </div>
          <div className="text-sm font-bold text-ink">
            ارفعي ملف PDF لـ {tripName ?? "الرحلة"}
          </div>
          <div className="text-xs text-ink/50">
            PDF فقط، حتى {(MAX_PDF_BYTES / 1024 / 1024).toFixed(0)} MB
          </div>
        </div>
      )}
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onPickFile}
        disabled={status === "uploading"}
      />
      <StatusLine status={status} message={message} />
    </label>
  );
}

function StatusLine({
  status,
  message,
}: {
  status: Status;
  message: string | null;
}) {
  if (!message) return null;
  const colorClass =
    status === "error"
      ? "text-red-600"
      : status === "success"
        ? "text-emerald-600"
        : "text-ink/60";
  return (
    <p className={`text-xs mt-3 font-semibold ${colorClass}`}>{message}</p>
  );
}
